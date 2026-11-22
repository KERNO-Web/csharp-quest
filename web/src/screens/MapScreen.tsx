import { WORLDS, ALL_LEVELS } from '../course/course';
import { useProgress } from '../state/progress';
import { Sprite, HERO } from '../ui/pixel';

export function MapScreen({ go }: { go: (h: string) => void }) {
  const p = useProgress();
  const next = ALL_LEVELS.find(l => !p.done[l.id]);
  const doneCount = Object.keys(p.done).length;
  const totalTopics = WORLDS.reduce((n, w) => n + w.topics.length, 0);
  const topicsDone = WORLDS.flatMap(w => w.topics).filter(t => t.levels.length && t.levels.every(l => p.done[l.id])).length;

  return (
    <main className="page">
      <section className="hello px">
        <div className="hello-hero">
          <Sprite rows={p.hero.name ? HERO : HERO.map(r => r.replace(/[^.]/g, 'l'))} size={72} />
        </div>
        <div className="hello-text">
          <div className="hello-name">{p.hero.name ? p.hero.name : 'Герой ещё не создан'}</div>
          <div className="hello-stats">
            <span><b>{p.xp}</b> опыта</span>
            <span><b>{topicsDone}</b>/{totalTopics} тем</span>
            <span><b>{p.cards.length}</b> карточек</span>
          </div>
        </div>
      </section>

      {next && (
        <button className="continue" onClick={() => go('#/l/' + next.id)}>
          <span className="continue-k">{doneCount ? 'Продолжить' : 'Начать'}</span>
          <span className="continue-t">{next.topic.n}. {next.title}</span>
          <span className="continue-m">≈ 5–7 минут</span>
        </button>
      )}

      {WORLDS.map(w => (
        <section key={w.id} className="world" style={{ ['--wc' as any]: w.color }}>
          <div className="world-head"><span className="world-num">МИР {w.n}</span><h2 className="world-title">{w.title}</h2></div>
          <p className="world-sub">{w.sub}</p>
          {w.topics.map(t => (
            <article key={t.id} className={'topic px' + (t.levels.length ? '' : ' locked')}>
              <div className="topic-top">
                <span className="topic-n">{String(t.n).padStart(2, '0')}</span>
                <div><div className="topic-title">{t.title}</div><div className="topic-sub">{t.sub}</div></div>
              </div>
              {t.levels.length ? (
                <div className="levels">
                  {t.levels.map((l, i) => {
                    const done = !!p.done[l.id];
                    const isNext = next?.id === l.id;
                    return (
                      <button key={l.id} title={l.title} aria-label={`${l.title}${done ? ', пройден' : ''}`}
                        className={['lv', done ? 'done' : 'open', isNext ? 'next' : '', l.boss ? 'boss' : ''].join(' ')}
                        onClick={() => go('#/l/' + l.id)}>
                        {l.boss ? 'БОСС' : i + 1}
                      </button>
                    );
                  })}
                </div>
              ) : <div className="soon">Уровни готовятся</div>}
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
