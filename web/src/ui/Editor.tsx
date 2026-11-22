import { useEffect, useRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration, type DecorationSet } from '@codemirror/view';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab, insertNewlineAndIndent } from '@codemirror/commands';
import { StreamLanguage, HighlightStyle, syntaxHighlighting, indentOnInput, bracketMatching, indentUnit } from '@codemirror/language';
import { csharp } from '@codemirror/legacy-modes/mode/clike';
import { tags as t } from '@lezer/highlight';

const style = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword], color: '#ff77a8' },
  { tag: [t.typeName, t.className, t.standard(t.variableName)], color: '#29adff' },
  { tag: [t.string, t.character, t.special(t.string)], color: '#ffccaa' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#ffa300' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#83769c', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.propertyName], color: '#ffec27' },
  { tag: [t.variableName, t.definition(t.variableName)], color: '#fff1e8' },
  { tag: [t.punctuation, t.bracket, t.operator], color: '#c2c3c7' },
]);

const setErr = StateEffect.define<number[]>();
const errField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) if (e.is(setErr)) {
      const ranges = e.value
        .filter(n => n >= 1 && n <= tr.state.doc.lines)
        .map(n => Decoration.line({ class: 'cm-errline' }).range(tr.state.doc.line(n).from));
      deco = Decoration.set(ranges, true);
    }
    if (tr.docChanged) deco = Decoration.none;
    return deco;
  },
  provide: f => EditorView.decorations.from(f),
});

const KEYS = [';', '{', '}', '(', ')', '"', '=', '+', '.', '<', '>', '[', ']', ',', '!', '&', '|', '-', '*', '/', ':', "'", '$'];
const PAIRS: Record<string, string> = { '(': ')', '[': ']', '"': '"' };

type Props = { value: string; onChange: (v: string) => void; errorLines?: number[]; file?: string; onRun?: () => void };

export function Editor({ value, onChange, errorLines = [], file = 'Program.cs', onRun }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  useEffect(() => {
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), highlightActiveLine(), highlightActiveLineGutter(), history(), indentOnInput(), bracketMatching(),
          indentUnit.of('    '),
          StreamLanguage.define(csharp), syntaxHighlighting(style), errField,
          keymap.of([{ key: 'Mod-Enter', run: () => { onRunRef.current?.(); return true; } }, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.updateListener.of(u => { if (u.docChanged) onChangeRef.current(u.state.doc.toString()); }),
          EditorView.contentAttributes.of({ autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Редактор кода' }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // external resets (e.g. "показать решение")
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => { view.current?.dispatch({ effects: setErr.of(errorLines) }); }, [errorLines.join(',')]);

  const insert = (k: string) => {
    const v = view.current; if (!v) return;
    const sel = v.state.selection.main;
    const close = PAIRS[k];
    if (k === '{') {
      v.dispatch({ changes: { from: sel.from, to: sel.to, insert: '{' }, selection: { anchor: sel.from + 1 } });
      insertNewlineAndIndent(v);
    } else if (close) {
      v.dispatch({ changes: { from: sel.from, to: sel.to, insert: k + close }, selection: { anchor: sel.from + 1 } });
    } else {
      v.dispatch({ changes: { from: sel.from, to: sel.to, insert: k }, selection: { anchor: sel.from + k.length } });
    }
    v.focus();
  };

  return (
    <div className="ide">
      <div className="ide-head"><span className="file-name">{file}</span><span className="kbd-hint">Ctrl/⌘ + Enter — запуск</span></div>
      <div className="cm-host" ref={host} />
      <div className="keys" aria-label="Символы">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => insert('    ')} aria-label="Отступ">tab</button>
        {KEYS.map(k => <button type="button" key={k} onMouseDown={e => e.preventDefault()} onClick={() => insert(k)}>{k}</button>)}
      </div>
    </div>
  );
}
