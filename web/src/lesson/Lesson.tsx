import { useEffect, useMemo, useState } from 'react';
import type { Step, Level } from '../course/types';
import { CodeView, highlight } from '../ui/CodeView';
import { Icon } from '../ui/pixel';
import { X as XIcon, Check } from 'lucide-react';
import { GameScene } from '../ui/GameScene';
import { sceneOf } from '../screens/scene';
import { VIZ } from '../viz/t01viz';
import { CodeTask } from './CodeTask';
import { warmUp } from '../runner/runner';
import { finishLevel, useProgress } from '../state/progress';
import { findLevel, ALL_LEVELS } from '../course/course';

const KICK: Record<Step['k'], string> = {
  say: 'Смотри', term: 'Новое слово', quiz: 'Вопрос', predict: 'Угадай вывод', blocks: 'Собери код',
  fill: 'Вставь пропуск', bug: 'Найди ошибку', code: 'Пиши код',
};

function shuffleIdx(n: number, seed: number) {
  const a = [...Array(n).keys()];
  let s = seed;
  for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

type Ans = number | number[] | null;

function isRight(step: Step, ans: Ans, pool: string[]): boolean {
  switch (step.k) {
    case 'quiz': case 'predict': case 'fill': return ans === step.answer;
    case 'bug': return ans === step.line;
    case 'blocks': return Array.isArray(ans) && ans.length === step.lines.length && ans.every((pi, i) => pool[pi] === step.lines[i]);
    default: return true;
  }
}

export function Lesson({ id, go }: { id: string; go: (h: string) => void }) {
  const level = findLevel(id);
  const [queue, setQueue] = useState<number[]>(() => level ? level.steps.map((_, i) => i) : []);
  const [pos, setPos] = useState(0);
  const [ans, setAns] = useState<Ans>(null);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [codeOk, setCodeOk] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mistakes, setMistakes] = useState(0);

  useEffect(() => { if (level?.steps.some(s => s.k === 'code')) warmUp(); }, [id]);
  useEffect(() => { window.scrollTo(0, 0); }, [pos]);

  const stepIdx = queue[pos];
  const step = level?.steps[stepIdx];
  const pool = useMemo(() => {
    if (!step || step.k !== 'blocks') return [] as string[];
    const all = [...step.lines, ...(step.extra ?? [])];
    return shuffleIdx(all.length, stepIdx + 7).map(i => all[i]);
  }, [stepIdx, step]);

  if (!level) return <div className="page"><p>Уровень не найден.</p><button className="btn" onClick={() => go('#/map')}>На карту</button></div>;
  if (finished) return <Done level={level} mistakes={mistakes} go={go} />;
  if (!step) return null;

  const passive = step.k === 'say' || step.k === 'term';
  const next = () => {
    setAns(null); setChecked(null); setCodeOk(false);
    if (pos + 1 >= queue.length) {
      const cards = level.steps.filter(s => s.k === 'term').map(s => (s as any).id);
      finishLevel(level.id, cards, 10 + level.steps.length * 2);
      setFinished(true);
    } else setPos(pos + 1);
  };
  const check = () => {
    const ok = isRight(step, ans, pool);
    setChecked(ok);
    if (!ok) { setMistakes(m => m + 1); setQueue(q => [...q, stepIdx]); } // wrong answers come back at the end
  };

  const total = queue.length;
  const ready = ans !== null && (!Array.isArray(ans) || (step.k === 'blocks' && ans.length === step.lines.length));

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="x" onClick={() => go('#/map')} aria-label="Выйти на карту"><XIcon size={18} strokeWidth={1.5} /></button>
        <div className="progress" aria-label={`Шаг ${pos + 1} из ${total}`}>
          {queue.map((_, i) => <i key={i} className={i < pos ? 'on' : i === pos ? 'cur' : ''} />)}
        </div>
      </div>
      <div className="step" key={pos}>
        <div className="kicker">{level.title} · {KICK[step.k]}</div>
        <StepView step={step} ans={ans} setAns={setAns} checked={checked} pool={pool} onCodePass={() => setCodeOk(true)} />
        {checked !== null && 'why' in step && (
          <div className={'verdict ' + (checked ? 'good' : 'bad')}>
            <h4>{checked ? <Check size={16} strokeWidth={2} /> : <XIcon size={16} strokeWidth={2} />}{checked ? 'Верно' : 'Не совсем'}</h4>
            <div>{step.why}</div>
            {!checked && <div className="note" style={{ marginTop: 6 }}>Этот вопрос вернётся в конце урока.</div>}
          </div>
        )}
      </div>
      <div className="dock"><div className="dock-in">
        {passive && <button className="btn wide" onClick={next}>Дальше</button>}
        {step.k === 'code' && <button className="btn wide" disabled={!codeOk} onClick={next}>{codeOk ? 'Дальше' : 'Запусти рабочий код'}</button>}
        {!passive && step.k !== 'code' && (checked === null
          ? <button className="btn wide" disabled={!ready} onClick={check}>Проверить</button>
          : <button className={'btn wide ' + (checked ? 'green' : 'pink')} onClick={next}>Дальше</button>)}
      </div></div>
    </div>
  );
}

function StepView({ step, ans, setAns, checked, pool, onCodePass }: {
  step: Step; ans: Ans; setAns: (a: Ans) => void; checked: boolean | null; pool: string[]; onCodePass: () => void;
}) {
  const locked = checked !== null;
  switch (step.k) {
    case 'say': {
      const Viz = step.viz ? VIZ[step.viz] : null;
      return (<>
        <div className="say" dangerouslySetInnerHTML={{ __html: step.text }} />
        {step.code && <CodeView code={step.code} hl={step.hl} />}
        {Viz && <Viz {...(step.vizProps ?? {})} />}
      </>);
    }
    case 'term':
      return (
        <div className="term px">
          <div className="term-row">
            <div>
              <div className="term-label">новое слово</div>
              <div className="term-word">{step.word}</div>
              {step.en && <div className="term-en">{step.en}</div>}
            </div>
            <span className="term-ico"><Icon name={step.icon} size={40} /></span>
          </div>
          <p className="term-def" dangerouslySetInnerHTML={{ __html: step.def }} />
          {step.like && <div className="term-like"><strong>Как в жизни. </strong>{step.like}</div>}
        </div>
      );
    case 'quiz': case 'predict': {
      const q = step.k === 'quiz' ? step.q : (step.q ?? 'Что выведет программа?');
      const mono = step.k === 'predict' || (step.k === 'quiz' && step.mono);
      return (<>
        <div className="say">{q}</div>
        {'code' in step && step.code && <CodeView code={step.code} />}
        <div className="opts" role="radiogroup">
          {step.options.map((o, i) => (
            <button key={i} role="radio" aria-checked={ans === i} disabled={locked}
              className={['opt', mono ? 'mono' : '', ans === i ? 'sel' : '', locked && i === step.answer ? 'right' : '', locked && ans === i && i !== step.answer ? 'wrong' : ''].join(' ')}
              onClick={() => setAns(i)}>{o}</button>
          ))}
        </div>
      </>);
    }
    case 'fill': {
      const order = shuffleIdx(step.options.length, step.code.length);
      const filled = ans !== null ? step.options[ans as number] : null;
      return (<>
        <div className="say">{step.q}</div>
        <CodeView code={step.code} renderLine={l => {
          if (!l.includes('___')) return highlight(l);
          const [a, b] = l.split('___');
          return <>{highlight(a)}<span className="blank">{filled ?? '   '}</span>{highlight(b)}</>;
        }} />
        <div className="chips-inline">
          {order.map(i => (
            <button key={i} disabled={locked}
              className={['chip', locked && i === step.answer ? 'right' : '', locked && ans === i && i !== step.answer ? 'wrong' : '', ans === i && !locked ? 'sel' : ''].join(' ')}
              onClick={() => setAns(i)}>{step.options[i]}</button>
          ))}
        </div>
      </>);
    }
    case 'bug':
      return (<>
        <div className="say">{step.q}</div>
        <CodeView code={step.code} onLine={locked ? undefined : n => setAns(n)}
          lineClass={n => locked ? (n === step.line ? 'ok' : n === ans ? 'no' : '') : (n === ans ? 'pick' : '')} />
      </>);
    case 'blocks': {
      const picked = (ans as number[] | null) ?? [];
      return (<>
        <div className="say">{step.q}</div>
        <div className="slots" aria-live="polite">
          {picked.map((pi, i) => (
            <button key={i} disabled={locked}
              className={'chip ' + (locked ? (pool[pi] === step.lines[i] ? 'right' : 'wrong') : '')}
              onClick={() => setAns(picked.filter((_, j) => j !== i))}>{pool[pi]}</button>
          ))}
        </div>
        <div className="pool">
          {pool.map((l, i) => (
            <button key={i} disabled={locked || picked.includes(i)} className={'chip' + (picked.includes(i) ? ' used' : '')}
              onClick={() => setAns([...picked, i])}>{l}</button>
          ))}
        </div>
        {!locked && picked.length > 0 && <button className="linkbtn" onClick={() => setAns(null)}>Начать заново</button>}
      </>);
    }
    case 'code':
      return <CodeTask step={step} onPass={onCodePass} />;
  }
}

function Done({ level, mistakes, go }: { level: Level; mistakes: number; go: (h: string) => void }) {
  const p = useProgress();
  const idx = ALL_LEVELS.findIndex(l => l.id === level.id);
  const nextLevel = ALL_LEVELS[idx + 1];
  const terms = level.steps.filter(s => s.k === 'term').length;
  return (
    <div className="lesson done-screen step">
      {level.unlocks === 'hero'
        ? <GameScene s={sceneOf(p)} caption="герой появился в игре" />
        : <div className="done-mark"><Check size={28} strokeWidth={2} /></div>}
      <h1 className="h1">Уровень пройден</h1>
      <p className="lead">{level.title}</p>
      <div className="reward">
        <div className="px"><div className="num">+{10 + level.steps.length * 2}</div><div className="lbl">опыта</div></div>
        {terms > 0 && <div className="px"><div className="num">+{terms}</div><div className="lbl">карточек в колоду</div></div>}
        <div className="px"><div className="num">{mistakes}</div><div className="lbl">{mistakes === 0 ? 'ошибок' : 'ошибок, все исправлены'}</div></div>
      </div>
      <div className="done-actions">
        {nextLevel && <button className="btn wide" onClick={() => go('#/l/' + nextLevel.id)}>Дальше: {nextLevel.title}</button>}
        <button className="btn ghost wide" onClick={() => go(level.unlocks ? '#/workshop' : '#/map')}>{level.unlocks ? 'Открыть мастерскую' : 'На карту'}</button>
      </div>
    </div>
  );
}

