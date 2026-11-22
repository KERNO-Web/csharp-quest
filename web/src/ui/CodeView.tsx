import type { ReactNode } from 'react';

const KW = new Set('abstract as base break case catch class const continue default do else enum explicit false finally for foreach goto if implicit in interface internal is namespace new null out override private protected public readonly ref return sealed static struct switch this throw true try using virtual void while var get set'.split(' '));
const TY = new Set('int string bool double float char long object decimal byte short uint Console List Dictionary Array String Math Exception'.split(' '));

// Very small C# highlighter for read-only snippets.
export function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    const [t, com, str, num, id] = m;
    const k = i++;
    if (com) out.push(<span key={k} className="tk-com">{t}</span>);
    else if (str) out.push(<span key={k} className="tk-str">{t}</span>);
    else if (num) out.push(<span key={k} className="tk-num">{t}</span>);
    else if (id && KW.has(id)) out.push(<span key={k} className="tk-kw">{t}</span>);
    else if (id && TY.has(id)) out.push(<span key={k} className="tk-ty">{t}</span>);
    else if (id && line[re.lastIndex] === '(') out.push(<span key={k} className="tk-fn">{t}</span>);
    else out.push(t);
  }
  return out;
}

type Props = {
  code: string;
  hl?: number[];
  onLine?: (n: number) => void;
  lineClass?: (n: number) => string;
  renderLine?: (line: string, n: number) => ReactNode;
};

export function CodeView({ code, hl = [], onLine, lineClass, renderLine }: Props) {
  const lines = code.split('\n');
  return (
    <div className="code" role={onLine ? 'listbox' : undefined}>
      {lines.map((l, idx) => {
        const n = idx + 1;
        const cls = ['ln', hl.includes(n) ? 'hl' : '', onLine ? 'tap' : '', lineClass?.(n) ?? ''].join(' ');
        return onLine ? (
          <div key={n} data-n={n} className={cls} role="option" tabIndex={0} aria-selected={false}
            onClick={() => onLine(n)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLine(n); } }}>
            <span className="lc">{renderLine ? renderLine(l, n) : highlight(l)}</span>
          </div>
        ) : (
          <div key={n} data-n={n} className={cls}><span className="lc">{renderLine ? renderLine(l, n) : highlight(l)}</span></div>
        );
      })}
    </div>
  );
}
