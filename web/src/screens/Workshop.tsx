import { WORLDS } from '../course/course';
import { useProgress } from '../state/progress';
import { GameScene } from '../ui/GameScene';
import { sceneOf, topicDone } from './scene';

const PARTS: Record<string, string> = {
  t01: 'Герой с именем', t02: 'Характеристики', t06: 'Законы мира', t07: 'Ходьба по карте', t08: 'Побег из боя',
  t04: 'Диалоги', t05: 'Инвентарь и сундук', t03: 'Виды предметов', t09: 'Монстры по чертежу', t10: 'Заклинания',
  t11: 'Появление монстров', t12: 'Защита от читов', t13: 'Семья врагов', t14: 'Особые атаки', t15: 'Бой с кем угодно',
  t16: 'Снаряжение', t17: 'Координаты', t18: 'Боссы', t19: 'Способности', t20: 'Мультикласс', t21: 'Игра не падает',
};

export function Workshop({ go }: { go: (h: string) => void }) {
  const p = useProgress();
  const topics = WORLDS.flatMap(w => w.topics);
  const done = topics.filter(t => topicDone(p, t.id)).length;

  return (
    <main className="page">
      <h1 className="h1">Мастерская</h1>
      <p className="lead">Твоя игра. Каждая тема добавляет в неё деталь, и всё это работает на твоём коде.</p>
      <GameScene s={sceneOf(p)} caption={`${done} из ${topics.length} деталей`} />
      {!p.hero.name && <button className="btn wide" style={{ marginBottom: 24 }} onClick={() => go('#/l/t01-1')}>Создать героя в теме 1</button>}

      <h2 className="h2" style={{ marginTop: 32 }}>Детали игры</h2>
      <div className="parts">
        {topics.map(t => {
          const on = topicDone(p, t.id);
          return (
            <div key={t.id} className={'part ' + (on ? 'on' : 'off')}>
              <span className="part-n">{String(t.n).padStart(2, '0')}</span>
              <span>{PARTS[t.id]}</span>
              <span className="part-st">{on ? 'готово' : `тема ${t.n}`}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
