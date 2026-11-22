import { ArrowRight } from 'lucide-react';
import { WORLDS, ALL_LEVELS } from '../course/course';
import { useProgress } from '../state/progress';
import { GameScene } from '../ui/GameScene';
import { sceneOf, topicDone } from './scene';

export function MapScreen({ go }: { go: (h: string) => void }) {
  const p = useProgress();
  const next = ALL_LEVELS.find(l => !p.done[l.id]);
  const doneCount = Object.keys(p.done).length;
  const topics = WORLDS.flatMap(w => w.topics);
  const topicsDone = topics.filter(t => topicDone(p, t.id)).length;
  const levelNo = next ? next.topic.levels.findIndex(l => l.id === next.id) + 1 : 0;

  return (
    <main className="page">
      <GameScene s={sceneOf(p)} caption={p.hero.name ? (p.hero.hp ? `HP ${p.hero.hp} · уровень ${p.hero.level ?? 1}` : 'характеристик пока нет') : 'появится после первой темы'} />

      {next && (
        <button className="continue" onClick={() => go('#/l/' + next.id)}>
          <span className="continue-body">
            <span className="continue-k">{doneCount ? 'Продолжить' : 'Начать'} · тема {next.topic.n}, уровень {levelNo}</span>
            <span className="continue-t">{next.title}</span>
            <span className="continue-m">5–7 минут</span>
          </span>
          <ArrowRight size={22} strokeWidth={1.75} />
        </button>
      )}
      <div className="stats">
        <span><b>{topicsDone}/{topics.length}</b>тем пройдено</span>
        <span><b>{p.xp}</b>опыта</span>
        <span><b>{p.cards.length}</b>карточек в колоде</span>
      </div>

      {WORLDS.map(w => (
        <section key={w.id} className="world">
          <div className="world-head"><span className="world-num">мир {w.n}</span><h2 className="world-title">{w.title}</h2></div>
          <p className="world-sub">{w.sub}</p>
          <div className="file">
            {w.topics.map(t => {
              const current = next?.topic.id === t.id;
              return (
                <article key={t.id} className={'topic' + (t.levels.length ? '' : ' locked') + (current ? ' current' : '')}>
                  <span className="topic-n">{String(t.n).padStart(2, '0')}</span>
                  <div><div className="topic-title">{t.title}</div><div className="topic-sub">{t.sub}</div></div>
                  {t.levels.length ? (
                    <div className="levels">
                      {t.levels.map((l, i) => {
                        const done = !!p.done[l.id];
                        return (
                          <button key={l.id} title={l.title} aria-label={`${l.title}${done ? ', пройден' : ''}`}
                            className={['lv', done ? 'done' : '', next?.id === l.id ? 'next' : '', l.boss ? 'boss' : ''].join(' ')}
                            onClick={() => go('#/l/' + l.id)}>
                            {l.boss ? 'босс' : i + 1}
                          </button>
                        );
                      })}
                    </div>
                  ) : <span className="soon">скоро</span>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
