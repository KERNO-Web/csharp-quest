// Real C# compiler (Roslyn on .NET WebAssembly). Runs on the page; loops are guarded inside the runner,
// so a hang ends with a friendly message instead of freezing the tab.
export type Diag = { id: string; severity: 'error' | 'warning'; file: string; line: number; col: number; endLine: number; endCol: number; msg: string; args: string[] };
export type RunResult = {
  ok: boolean;
  stage: 'compile' | 'run' | 'runtime' | 'timeout' | 'fatal';
  output: string;
  diags: Diag[];
  error?: { type: string; message: string; line: number } | null;
};
export type RunnerState = 'cold' | 'loading' | 'ready' | 'error';

const REFS = ['System.Runtime', 'System.Console', 'System.Collections', 'System.Collections.NonGeneric', 'System.Linq', 'System.Memory', 'System.Text.RegularExpressions', 'System.Runtime.Extensions', 'netstandard'];
const base = import.meta.env.BASE_URL;
let exportsP: Promise<any> | null = null;
let state: RunnerState = 'cold';
const listeners = new Set<(s: RunnerState) => void>();
function setState(s: RunnerState) { state = s; listeners.forEach(f => f(s)); }
export function onRunnerState(f: (s: RunnerState) => void) { listeners.add(f); f(state); return () => { listeners.delete(f); }; }

// hidden from Vite's dev rewriter, which breaks imports of files in /public
const nativeImport = new Function('u', 'return import(u)') as (u: string) => Promise<any>;

async function boot() {
  setState('loading');
  const { dotnet } = await nativeImport(new URL(base + 'runner/_framework/dotnet.js', location.href).href);
  const rt = await dotnet.create();
  const exp = await rt.getAssemblyExports(rt.getConfig().mainAssemblyName);
  const bufs = await Promise.all(REFS.map(r => fetch(base + 'runner/refs/' + r + '.dll').then(x => x.arrayBuffer())));
  for (const b of bufs) exp.Runner.AddReference(new Uint8Array(b));
  // Roslyn's first compile of a full program trips a lazy init that needs threads; warm it up twice.
  const warm = 'using System;\nnamespace W { class P { static int F(ref int a, out int b) { b = a; return a; } static void Main() { int x = 1; string s = $"{x}"; var l = new List<int> { x }; foreach (var i in l) { if (i > 0) continue; } try { F(ref x, out var y); } catch (Exception) { } Console.WriteLine(s + l.Sum()); } } }';
  for (let i = 0; i < 2; i++) { try { exp.Runner.Run([warm], ''); } catch { /* expected once */ } }
  setState('ready');
  return exp;
}

export function warmUp() {
  if (!exportsP) {
    exportsP = boot();
    exportsP.catch(() => { exportsP = null; setState('error'); });
  }
  return exportsP;
}

export async function runCSharp(sources: string[], stdin = ''): Promise<RunResult> {
  try {
    const exp = await warmUp();
    await new Promise(r => setTimeout(r, 30)); // let the UI paint "running"
    let raw: string;
    try { raw = exp.Runner.Run(sources, stdin); }
    catch (e: any) { if (!String(e?.message).includes('monitors')) throw e; raw = exp.Runner.Run(sources, stdin); }
    const r = JSON.parse(raw);
    return { ...r, output: r.output ?? '', diags: r.diags ?? [] };
  } catch (e: any) {
    return { ok: false, stage: 'fatal', output: '', diags: [], error: { type: 'Runner', message: String(e?.message ?? e), line: 0 } };
  }
}
