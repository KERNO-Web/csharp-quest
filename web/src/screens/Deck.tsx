import { useMemo, useState } from 'react';
import { ALL_TERMS } from '../course/course';
import { useProgress } from '../state/progress';
import { Icon } from '../ui/pixel';

export function Deck({ go }: { go: (h: string) => void }) {
  const p = useProgress();
  const mine = ALL_TERMS.filter(t => p.cards.includes(t.id));
  const [mode, setMode] = useState<'list' | 'drill'>('list');

  if (!mine.length) return (
    <main className="page">
      <h1 className="h1">Колода</h1>
      <p className="lead">Здесь копятся карточки терминов. Пройди первый уровень, и появятся первые.</p>
      <button className="btn" onClick={() => go('#/map')}>К урокам</button>
    </main>
  );

  return (
    <main className="page">
      <h1 className="h1">Колода</h1>
      <p className="lead">{mine.length} карточек. Повторение — 5 случайных карточек: видишь слово, вспоминаешь, переворачиваешь.</p>
      {mode === 'list' ? (<>
        <button className="btn wide" style={{ marginBottom: 24 }} onClick={() => setMode('drill')}>Повторить 5 карточек</button>
        <div className="deck">
          {mine.map(t => (
            <div key={t.id} className="mini-term px">
              <div className="mini-head"><h3>{t.word}</h3><Icon name={t.icon} size={32} /></div>
              <p dangerouslySetInnerHTML={{ __html: t.def }} />
            </div>
          ))}
        </div>
      </>) : <Drill cards={mine} onExit={() => setMode('list')} />}
    </main>
  );
}

function Drill({ cards, onExit }: { cards: typeof ALL_TERMS; onExit: () => void }) {
  const pick = useMemo(() => [...cards].sort(() => Math.random() - .5).slice(0, 5), [cards]);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const c = pick[i];
  if (!c) return (
    <div className="done-screen">
      <h2 className="h2">Повторение окончено</h2>
      <p className="lead">Пять карточек освежены.</p>
      <button className="btn" onClick={onExit}>К колоде</button>
    </div>
  );
  return (
    <div>
      <p className="note">{i + 1} из {pick.length}</p>
      <button className={'flip px' + (open ? ' open' : '')} onClick={() => setOpen(true)} key={i}>
        <Icon name={c.icon} size={56} />
        <div className="term-word">{c.word}</div>
        {open ? <p className="term-def" dangerouslySetInnerHTML={{ __html: c.def }} /> : <p className="note">Вспомни, что это. Потом нажми.</p>}
      </button>
      {open && <button className="btn wide" style={{ marginTop: 18 }} onClick={() => { setI(i + 1); setOpen(false); }}>Дальше</button>}
    </div>
  );
}
