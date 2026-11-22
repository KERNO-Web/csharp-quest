import type { ReactElement } from 'react';
import { WORLDS } from '../course/course';
import { useProgress } from '../state/progress';
import { HERO, SLIME, CHEST } from '../ui/pixel';

const PARTS: Record<string, string> = {
  t01: 'Герой с именем', t02: 'Характеристики', t06: 'Законы мира', t07: 'Ходьба по карте', t08: 'Побег из боя',
  t04: 'Диалоги', t05: 'Инвентарь', t03: 'Виды предметов', t09: 'Монстры по чертежу', t10: 'Заклинания',
  t11: 'Появление монстров', t12: 'Защита от читов', t13: 'Семья врагов', t14: 'Особые атаки', t15: 'Бой с кем угодно',
  t16: 'Снаряжение', t17: 'Координаты', t18: 'Боссы', t19: 'Способности', t20: 'Мультикласс', t21: 'Игра не падает',
};

function rects(rows: string[], ox: number, oy: number, ghost = false, key = '') {
  const pal: Record<string, string> = { k: '#000', w: '#fff1e8', y: '#ffec27', o: '#ffa300', g: '#00e436', G: '#008751', b: '#29adff', p: '#ff77a8', e: '#ffccaa', n: '#ab5236' };
  const out: ReactElement[] = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '.') return;
    out.push(<rect key={key + x + '-' + y} x={ox + x} y={oy + y} width={1} height={1} fill={ghost ? '#26346a' : pal[c] ?? '#83769c'} />);
  }));
  return out;
}

const STARS = [[8, 6], [22, 12], [40, 4], [57, 10], [75, 5], [92, 13], [108, 7], [121, 3], [15, 20], [100, 22], [66, 18]];

export function Workshop({ go }: { go: (h: string) => void }) {
  const p = useProgress();
  const topics = WORLDS.flatMap(w => w.topics);
  const isDone = (id: string) => { const t = topics.find(x => x.id === id); return !!t && t.levels.length > 0 && t.levels.every(l => p.done[l.id]); };
  const hasHero = isDone('t01') || !!p.hero.name;

  return (
    <main className="page">
      <h1 className="h1">Мастерская</h1>
      <p className="lead">Твоя игра. Каждая пройденная тема добавляет в неё кусок, и всё это работает на твоём коде.</p>
      <div className="screen">
        <svg viewBox="0 0 128 72" shapeRendering="crispEdges" role="img" aria-label={hasHero ? `Игровой экран: герой ${p.hero.name ?? ''}` : 'Игровой экран пока пустой'}>
          <rect width="128" height="72" fill="#0b0d1c" />
          {STARS.map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" fill={i % 3 ? '#83769c' : '#fff1e8'} className={i % 4 === 0 ? 'twinkle' : undefined} />)}
          <rect x="0" y="52" width="128" height="20" fill="#008751" />
          <rect x="0" y="52" width="128" height="2" fill="#00e436" />
          {[6, 19, 33, 47, 71, 88, 103, 117].map(x => <rect key={x} x={x} y="58" width="2" height="1" fill="#00e436" />)}
          {rects(SLIME, 92, 38, !isDone('t09'), 's')}
          {rects(CHEST, 18, 38, !isDone('t05'), 'c')}
          {hasHero ? (
            <g className="hero-bob">
              {rects(HERO, 56, 37, false, 'h')}
              {p.hero.hp && <>
                <rect x="54" y="31" width="20" height="3" fill="#000" />
                <rect x="55" y="32" width="18" height="1" fill="#00e436" />
              </>}
            </g>
          ) : (
            <>
              {rects(HERO, 56, 37, true, 'h')}
              <text x="64" y="30" textAnchor="middle" fontFamily="Tiny5" fontSize="6" fill="#ffec27">???</text>
            </>
          )}
          {hasHero && p.hero.name && <text x="64" y={p.hero.hp ? 28 : 33} textAnchor="middle" fontFamily="Tiny5" fontSize="6" fill="#fff1e8">{p.hero.name}</text>}
          {!hasHero && <text x="64" y="66" textAnchor="middle" fontFamily="Tiny5" fontSize="5" fill="#fff1e8">ИГРА НЕ ЗАПУЩЕНА</text>}
        </svg>
      </div>

      <h2 className="h2">Детали игры</h2>
      <p className="note" style={{ marginTop: 0, marginBottom: 16 }}>{Object.keys(PARTS).filter(isDone).length} из {Object.keys(PARTS).length} собрано</p>
      <div className="parts">
        {topics.map(t => (
          <div key={t.id} className={'part px' + (isDone(t.id) ? '' : ' off')}>
            <span className="part-n">{isDone(t.id) ? '✓' : String(t.n).padStart(2, '0')}</span>
            <span>{PARTS[t.id]}</span>
          </div>
        ))}
      </div>
      {!hasHero && <button className="btn wide" style={{ marginTop: 24 }} onClick={() => go('#/map')}>Создать героя: тема 1</button>}
    </main>
  );
}
