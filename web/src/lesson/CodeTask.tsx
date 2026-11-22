import { useEffect, useState } from 'react';
import { Play, RotateCcw, Check, X as XIcon } from 'lucide-react';
import type { CodeStep } from '../course/types';
import { Editor } from '../ui/Editor';
import { runCSharp, onRunnerState, type RunResult, type RunnerState } from '../runner/runner';
import { explain, explainRuntime } from '../runner/errors';
import { getProgress, update } from '../state/progress';

const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map(l => l.trimEnd()).join('\n').trim();
const stripComments = (s: string) => s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

type Verdict = { pass: boolean; title: string; text: string };

export function judge(step: CodeStep, code: string, r: RunResult): Verdict | null {
  if (r.stage !== 'run') return null;
  const out = norm(r.output);
  const src = stripComments(code);
  const c = step.check;
  for (const s of c.contains ?? []) if (!src.includes(s)) return { pass: false, title: 'Почти', text: `Программа работает, но в коде не хватает <b>${esc(s)}</b>. Перечитай задание.` };
  for (const s of c.notContains ?? []) if (src.includes(s)) return { pass: false, title: 'Почти', text: `В коде всё ещё есть <b>${esc(s)}</b>. Его нужно заменить.` };
  if (c.output !== undefined && out !== norm(c.output)) return { pass: false, title: 'Вывод не совпал', text: `Нужно: <code>${esc(c.output)}</code><br>Получилось: <code>${esc(out) || '(пусто)'}</code>` };
  if (c.match && !new RegExp(c.match, 's').test(out)) return { pass: false, title: 'Вывод не совпал', text: `Сравни свой вывод с примером в задании. Важна каждая буква, пробел и знак.<br>Получилось: <code>${esc(out) || '(пусто)'}</code>` };
  if (c.lines && out.split('\n').length < c.lines) return { pass: false, title: 'Мало строк', text: `Нужно хотя бы ${c.lines} строк(и) вывода.` };
  return { pass: true, title: 'Работает', text: 'Компилятор доволен, вывод правильный.' };
}

function esc(s: string) { return s.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]!)); }

export function CodeTask({ step, onPass }: { step: CodeStep; onPass: () => void }) {
  const saved = getProgress().codes[step.id];
  const [code, setCode] = useState(saved ?? step.start);
  const [res, setRes] = useState<RunResult | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [running, setRunning] = useState(false);
  const [fails, setFails] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [rs, setRs] = useState<RunnerState>('cold');
  useEffect(() => onRunnerState(setRs), []);

  const run = async () => {
    if (running) return;
    setRunning(true); setVerdict(null);
    const r = await runCSharp(step.harness ? [code, step.harness] : [code], step.stdin ?? '');
    setRes(r);
    const v = judge(step, code, r);
    setVerdict(v);
    setRunning(false);
    update(p => { p.codes[step.id] = code; return p; });
    if (v?.pass) {
      if (step.game) applyGame(step, r.output);
      onPass();
    } else setFails(f => f + 1);
  };

  const errs = res?.stage === 'compile' ? res.diags.filter(d => d.severity === 'error' && d.file === 'main.cs').slice(0, 2) : [];
  const errLines = res?.stage === 'compile' ? errs.map(e => e.line) : res?.error?.line ? [res.error.line] : [];

  return (
    <div>
      <div className="task px"><div className="task-label">Задание</div><div dangerouslySetInnerHTML={{ __html: step.task }} /></div>
      <Editor value={code} onChange={setCode} errorLines={errLines} onRun={run} />
      <div className="run-row">
        <button className="btn green" onClick={run} disabled={running || rs === 'loading'}>
          {rs === 'loading' ? 'Компилятор просыпается…' : running ? 'Запускаю…' : <><Play size={16} strokeWidth={1.75} />Запустить</>}
        </button>
        <button className="btn ghost" onClick={() => { setCode(step.start); setRes(null); setVerdict(null); }} aria-label="Вернуть стартовый код"><RotateCcw size={16} strokeWidth={1.75} /></button>
      </div>
      {rs === 'loading' && <p className="note">Первый запуск грузит настоящий компилятор C#, это 5–15 секунд. Дальше он работает мгновенно.</p>}

      {res && (
        <div className="console" aria-live="polite">
          <span className="console-label">вывод программы</span>
          {res.output ? res.output : <span className="muted">{res.stage === 'compile' ? 'программа не запустилась' : '(программа ничего не вывела)'}</span>}
        </div>
      )}

      {errs.map((d, i) => (
        <div className="err-card" key={i}>
          <div className="where">Строка {d.line}: ошибка {d.id}</div>
          <div dangerouslySetInnerHTML={{ __html: explain(d) || 'Компилятор нашёл ошибку. Посмотри внимательно на эту строку.' }} />
          <div className="orig">{d.msg}</div>
        </div>
      ))}
      {res?.stage === 'runtime' && res.error && (
        <div className="err-card">
          <div className="where">Программа упала{res.error.line ? ` на строке ${res.error.line}` : ''}: {res.error.type}</div>
          <div>{explainRuntime(res.error.type)}</div>
          {res.error.message && !res.error.message.startsWith('Arg_') && <div className="orig">{res.error.message}</div>}
        </div>
      )}
      {res?.stage === 'timeout' && (
        <div className="err-card">
          <div className="where">Программа зависла{res.error?.line ? ` (строка ${res.error.line})` : ''}</div>
          <div>{res.error?.type === 'StackOverflowException' ? 'Метод вызывает сам себя без конца. Я его остановил.' : 'Похоже, цикл никогда не заканчивается. Я остановил программу через 4 секунды.'}</div>
        </div>
      )}
      {res?.stage === 'fatal' && <div className="err-card"><div className="where">Компилятор не загрузился</div><div>Проверь интернет и нажми «Запустить» ещё раз.</div><div className="orig">{res.error?.message}</div></div>}

      {verdict && (
        <div className={'verdict ' + (verdict.pass ? 'good' : 'bad')}>
          <h4>{verdict.pass ? <Check size={16} strokeWidth={2} /> : <XIcon size={16} strokeWidth={2} />}{verdict.title}</h4>
          <div dangerouslySetInnerHTML={{ __html: verdict.text }} />
        </div>
      )}

      {!verdict?.pass && (fails >= 1 || showHint) && (
        <div className="hint-box">
          {!showHint ? <button className="linkbtn" onClick={() => setShowHint(true)}>Подсказка</button>
            : <p className="note" dangerouslySetInnerHTML={{ __html: step.hint }} />}
          {fails >= 3 && <button className="linkbtn" onClick={() => setCode(step.solution)}>Показать решение в редакторе</button>}
        </div>
      )}
    </div>
  );
}

function applyGame(step: CodeStep, output: string) {
  const out = norm(output);
  if (step.game === 'heroName') {
    const name = out.split('\n')[0].trim().slice(0, 24);
    update(p => { p.hero = { ...p.hero, name, at: Date.now() }; return p; });
  }
  if (step.game === 'heroStats') {
    const m = out.match(/^Герой: (.+)$/m);
    update(p => { p.hero = { ...p.hero, name: m ? m[1].trim().slice(0, 24) : p.hero.name, hp: 100, level: 1, at: Date.now() }; return p; });
  }
}
