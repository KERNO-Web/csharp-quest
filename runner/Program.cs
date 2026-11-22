using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Runtime.InteropServices.JavaScript;
using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;

public static partial class Runner
{
    static readonly List<MetadataReference> Refs = new();
    const int MaxOut = 20000;

    public static void Main() { }

    [JSExport]
    public static void AddReference(byte[] image) => Refs.Add(MetadataReference.CreateFromImage(image));

    // sources: [userCode, harness?]. Returns JSON {ok, stage, out, diags[], error?}
    [JSExport]
    public static string Run(string[] sources, string stdin)
    {
        var parse = new CSharpParseOptions(LanguageVersion.Latest);
        var trees = new List<SyntaxTree>();
        trees.Add(CSharpSyntaxTree.ParseText(
            "global using System; global using System.Collections.Generic; global using System.Linq;", parse, "_usings.cs", Encoding.UTF8));
        trees.Add(CSharpSyntaxTree.ParseText(
            "static class __Stdin { public static System.IO.StringReader R = new System.IO.StringReader(\"\"); public static string ReadLine() => R.ReadLine(); public static int Read() => R.Read(); }", parse, "_stdin.cs", Encoding.UTF8));
        trees.Add(CSharpSyntaxTree.ParseText(
            "sealed class __Hang : System.Exception { public __Hang() : base(\"hang\") {} } static class __Guard { public static int L; static long n; static readonly System.Diagnostics.Stopwatch sw = System.Diagnostics.Stopwatch.StartNew(); public static void Tick() { n++; if (n > 30000000 || ((n & 0x3FFF) == 0 && sw.ElapsedMilliseconds > 4000)) throw new __Hang(); } public static void Enter() { Tick(); System.Runtime.CompilerServices.RuntimeHelpers.EnsureSufficientExecutionStack(); } }", parse, "_guard.cs", Encoding.UTF8));
        for (int i = 0; i < sources.Length; i++)
            trees.Add(CSharpSyntaxTree.ParseText(sources[i].Replace("Console.ReadLine(", "__Stdin.ReadLine(").Replace("Console.Read(", "__Stdin.Read("), parse, i == 0 ? "main.cs" : $"test{i}.cs", Encoding.UTF8));

        var comp = CSharpCompilation.Create("UserProgram", trees, Refs,
            new CSharpCompilationOptions(OutputKind.ConsoleApplication,
                optimizationLevel: OptimizationLevel.Debug, allowUnsafe: false, concurrentBuild: false,
                specificDiagnosticOptions: new Dictionary<string, ReportDiagnostic> { ["CS0105"] = ReportDiagnostic.Suppress, ["CS8019"] = ReportDiagnostic.Suppress }));

        var all = comp.GetDiagnostics();
        var diags = all
            .Where(d => d.Severity == DiagnosticSeverity.Error || (d.Severity == DiagnosticSeverity.Warning && d.Location.SourceTree?.FilePath == "main.cs"))
            .Select(d =>
            {
                var span = d.Location.GetLineSpan();
                return new Diag
                {
                    id = d.Id,
                    severity = d.Severity == DiagnosticSeverity.Error ? "error" : "warning",
                    file = d.Location.SourceTree?.FilePath ?? "",
                    line = span.StartLinePosition.Line + 1,
                    col = span.StartLinePosition.Character + 1,
                    endLine = span.EndLinePosition.Line + 1,
                    endCol = span.EndLinePosition.Character + 1,
                    msg = d.GetMessage(),
                    args = ExtractArgs(d)
                };
            }).ToList();

        if (all.Any(d => d.Severity == DiagnosticSeverity.Error))
            return Json(new Result { ok = false, stage = "compile", diags = diags });

        // Insert loop/recursion guards so a hang never freezes the page.
        var guarded = comp;
        foreach (var t in comp.SyntaxTrees.Where(t => t.FilePath == "main.cs" || t.FilePath.StartsWith("test")))
        {
            var root = new GuardRewriter().Visit(t.GetRoot());
            guarded = guarded.ReplaceSyntaxTree(t, t.WithRootAndOptions(root, t.Options));
        }
        using var pe = new MemoryStream();
        using var pdb = new MemoryStream();
        var emit = guarded.Emit(pe, pdb, options: new EmitOptions(debugInformationFormat: DebugInformationFormat.PortablePdb));
        if (!emit.Success)
            return Json(new Result { ok = false, stage = "compile", diags = emit.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error).Select(d => new Diag { id = d.Id, severity = "error", file = "", line = 0, col = 0, msg = d.GetMessage(), args = Array.Empty<string>() }).ToList() });

        var asm = Assembly.Load(pe.ToArray(), pdb.ToArray());
        var entry = asm.EntryPoint;
        var writer = new CappedWriter(MaxOut);
        var oldOut = Console.Out;
        Console.SetOut(writer);
        var stdinField = asm.GetType("__Stdin")?.GetField("R");
        stdinField?.SetValue(null, new StringReader(stdin ?? ""));
        try
        {
            var ps = entry.GetParameters();
            var ret = entry.Invoke(null, ps.Length == 1 ? new object[] { Array.Empty<string>() } : null);
            return Json(new Result { ok = true, stage = "run", output = writer.ToString(), diags = diags });
        }
        catch (TargetInvocationException tie) when (tie.InnerException != null)
        {
            var ex = tie.InnerException;
            if (ex.GetType().Name == "__Hang" || ex is InsufficientExecutionStackException)
                return Json(new Result { ok = false, stage = "timeout", output = writer.ToString(), diags = diags,
                    error = new Err { type = ex is InsufficientExecutionStackException ? "StackOverflowException" : "Hang", message = "", line = LastLine(asm) } });
            return Json(new Result
            {
                ok = false, stage = "runtime", output = writer.ToString(), diags = diags,
                error = new Err { type = ex.GetType().Name, message = ex.Message, line = LastLine(asm) }
            });
        }
        catch (Exception ex)
        {
            return Json(new Result { ok = false, stage = "runtime", output = writer.ToString(), diags = diags,
                error = new Err { type = ex.GetType().Name, message = ex.Message } });
        }
        finally
        {
            Console.SetOut(oldOut);
        }
    }

    static string[] ExtractArgs(Diagnostic d)
    {
        try
        {
            var prop = d.GetType().GetProperty("Arguments", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            if (prop?.GetValue(d) is IEnumerable<object> a) return a.Select(x => x?.ToString() ?? "").ToArray();
        }
        catch { }
        return Array.Empty<string>();
    }

    static int LastLine(Assembly asm)
    {
        try { return (int)(asm.GetType("__Guard")?.GetField("L")?.GetValue(null) ?? 0); } catch { return 0; }
    }

    static int FindLine(Exception ex)
    {
        var st = new System.Diagnostics.StackTrace(ex, true);
        foreach (var f in st.GetFrames() ?? Array.Empty<System.Diagnostics.StackFrame>())
        {
            if (f.GetFileName() == "main.cs" && f.GetFileLineNumber() > 0) return f.GetFileLineNumber();
        }
        return 0;
    }

    static string Json(Result r) => JsonSerializer.Serialize(r, RunnerJson.Default.Result);

    sealed class CappedWriter : StringWriter
    {
        readonly int cap; public bool Truncated;
        public CappedWriter(int cap) { this.cap = cap; }
        public override void Write(char value)
        {
            if (GetStringBuilder().Length >= cap) { Truncated = true; return; }
            base.Write(value);
        }
        public override void Write(string value)
        {
            if (value == null) return;
            var sb = GetStringBuilder();
            if (sb.Length >= cap) { Truncated = true; return; }
            base.Write(value.Length + sb.Length > cap ? value.Substring(0, cap - sb.Length) : value);
        }
        public override void Write(char[] buffer, int index, int count) => Write(new string(buffer, index, count));
    }
}

sealed class GuardRewriter : Microsoft.CodeAnalysis.CSharp.CSharpSyntaxRewriter
{
    static Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax G(string m) => SyntaxFactory.ParseStatement("__Guard." + m + "();");
    static Microsoft.CodeAnalysis.CSharp.Syntax.BlockSyntax Wrap(Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax st)
        => st is Microsoft.CodeAnalysis.CSharp.Syntax.BlockSyntax b ? b.WithStatements(b.Statements.Insert(0, G("Tick"))) : SyntaxFactory.Block(G("Tick"), st);
    static Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax Mark(SyntaxNode n) => SyntaxFactory.ParseStatement("__Guard.L=" + (n.GetLocation().GetLineSpan().StartLinePosition.Line + 1) + ";");
    public override SyntaxNode VisitBlock(Microsoft.CodeAnalysis.CSharp.Syntax.BlockSyntax n)
    {
        var list = new List<Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax>();
        foreach (var st in n.Statements)
        {
            if (st is not Microsoft.CodeAnalysis.CSharp.Syntax.LocalFunctionStatementSyntax) list.Add(Mark(st));
            list.Add((Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax)Visit(st));
        }
        return n.WithStatements(SyntaxFactory.List(list));
    }
    public override SyntaxNode VisitSwitchSection(Microsoft.CodeAnalysis.CSharp.Syntax.SwitchSectionSyntax n)
    {
        var list = new List<Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax>();
        foreach (var st in n.Statements) { list.Add(Mark(st)); list.Add((Microsoft.CodeAnalysis.CSharp.Syntax.StatementSyntax)Visit(st)); }
        return n.WithStatements(SyntaxFactory.List(list));
    }
    public override SyntaxNode VisitCompilationUnit(Microsoft.CodeAnalysis.CSharp.Syntax.CompilationUnitSyntax n)
    {
        var members = new List<Microsoft.CodeAnalysis.CSharp.Syntax.MemberDeclarationSyntax>();
        foreach (var m in n.Members)
        {
            if (m is Microsoft.CodeAnalysis.CSharp.Syntax.GlobalStatementSyntax g && g.Statement is not Microsoft.CodeAnalysis.CSharp.Syntax.LocalFunctionStatementSyntax)
                members.Add(SyntaxFactory.GlobalStatement(Mark(g)));
            members.Add((Microsoft.CodeAnalysis.CSharp.Syntax.MemberDeclarationSyntax)Visit(m));
        }
        return n.WithMembers(SyntaxFactory.List(members));
    }
    public override SyntaxNode VisitWhileStatement(Microsoft.CodeAnalysis.CSharp.Syntax.WhileStatementSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.WhileStatementSyntax)base.VisitWhileStatement(n); return n.WithStatement(Wrap(n.Statement)); }
    public override SyntaxNode VisitDoStatement(Microsoft.CodeAnalysis.CSharp.Syntax.DoStatementSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.DoStatementSyntax)base.VisitDoStatement(n); return n.WithStatement(Wrap(n.Statement)); }
    public override SyntaxNode VisitForStatement(Microsoft.CodeAnalysis.CSharp.Syntax.ForStatementSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.ForStatementSyntax)base.VisitForStatement(n); return n.WithStatement(Wrap(n.Statement)); }
    public override SyntaxNode VisitForEachStatement(Microsoft.CodeAnalysis.CSharp.Syntax.ForEachStatementSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.ForEachStatementSyntax)base.VisitForEachStatement(n); return n.WithStatement(Wrap(n.Statement)); }
    public override SyntaxNode VisitLabeledStatement(Microsoft.CodeAnalysis.CSharp.Syntax.LabeledStatementSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.LabeledStatementSyntax)base.VisitLabeledStatement(n); return n.WithStatement(Wrap(n.Statement)); }
    public override SyntaxNode VisitMethodDeclaration(Microsoft.CodeAnalysis.CSharp.Syntax.MethodDeclarationSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.MethodDeclarationSyntax)base.VisitMethodDeclaration(n); return n.Body == null ? n : n.WithBody(n.Body.WithStatements(n.Body.Statements.Insert(0, G("Enter")))); }
    public override SyntaxNode VisitLocalFunctionStatement(Microsoft.CodeAnalysis.CSharp.Syntax.LocalFunctionStatementSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.LocalFunctionStatementSyntax)base.VisitLocalFunctionStatement(n); return n.Body == null ? n : n.WithBody(n.Body.WithStatements(n.Body.Statements.Insert(0, G("Enter")))); }
    public override SyntaxNode VisitConstructorDeclaration(Microsoft.CodeAnalysis.CSharp.Syntax.ConstructorDeclarationSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.ConstructorDeclarationSyntax)base.VisitConstructorDeclaration(n); return n.Body == null ? n : n.WithBody(n.Body.WithStatements(n.Body.Statements.Insert(0, G("Enter")))); }
    public override SyntaxNode VisitAccessorDeclaration(Microsoft.CodeAnalysis.CSharp.Syntax.AccessorDeclarationSyntax n) { n = (Microsoft.CodeAnalysis.CSharp.Syntax.AccessorDeclarationSyntax)base.VisitAccessorDeclaration(n); return n.Body == null ? n : n.WithBody(n.Body.WithStatements(n.Body.Statements.Insert(0, G("Enter")))); }
}

public class Diag { public string id { get; set; } public string severity { get; set; } public string file { get; set; } public int line { get; set; } public int col { get; set; } public int endLine { get; set; } public int endCol { get; set; } public string msg { get; set; } public string[] args { get; set; } }
public class Err { public string type { get; set; } public string message { get; set; } public int line { get; set; } }
public class Result { public bool ok { get; set; } public string stage { get; set; } public string output { get; set; } public List<Diag> diags { get; set; } public Err error { get; set; } }

[System.Text.Json.Serialization.JsonSerializable(typeof(Result))]
public partial class RunnerJson : System.Text.Json.Serialization.JsonSerializerContext { }
