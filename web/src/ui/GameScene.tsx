import type { ReactElement } from 'react';
import { HERO, SLIME, CHEST } from './pixel';

// The one rich moment of the app: the player's own game, drawn as pixel art at sunset.
const W = 192, H = 96, GROUND = 74;

const SKY: [number, string][] = [
  [0, '#211b31'], [12, '#2e2244'], [22, '#4a2b4f'], [31, '#733656'], [39, '#a44a58'], [46, '#d06650'], [53, '#ec8c4c'], [59, '#f7b75c'],
];

function wave(x: number, a: number[], base: number) {
  return Math.round(base + a[0] * Math.sin(x / 17 + 1.3) + a[1] * Math.sin(x / 7.3 + 0.4) + a[2] * Math.sin(x / 31 + 2.1));
}

const PAL: Record<string, string> = { k: '#120f14', w: '#fff1e8', y: '#ffd166', o: '#f29e4c', g: '#7ccf6a', G: '#3e8a4f', b: '#5aa9e6', p: '#f28da0', e: '#ffcfa8', n: '#9a5a3c' };

function sprite(rows: string[], ox: number, oy: number, ghost: boolean, key: string) {
  const out: ReactElement[] = [];
  rows.forEach((r, y) => {
    let x = 0;
    while (x < r.length) {
      const c = r[x];
      if (c === '.') { x++; continue; }
      let run = 1;
      while (r[x + run] === c) run++;
      out.push(<rect key={`${key}${x}-${y}`} x={ox + x} y={oy + y} width={run} height={1} fill={ghost ? '#2a2733' : PAL[c] ?? '#6f685f'} />);
      x += run;
    }
  });
  return out;
}

// static landscape, computed once
const LAND: ReactElement[] = (() => {
  const els: ReactElement[] = [];
  SKY.forEach(([y, c], i) => {
    const next = SKY[i + 1]?.[0] ?? GROUND;
    els.push(<rect key={'s' + i} x={0} y={y} width={W} height={next - y} fill={c} />);
    if (i > 0) {
      for (let x = (y % 2); x < W; x += 2) els.push(<rect key={`d${i}-${x}`} x={x} y={y} width={1} height={1} fill={SKY[i - 1][1]} />);
      for (let x = (y % 4); x < W; x += 4) els.push(<rect key={`e${i}-${x}`} x={x} y={y + 1} width={1} height={1} fill={SKY[i - 1][1]} />);
    }
  });
  [[12, 6], [30, 3], [51, 9], [77, 4], [96, 11], [118, 5], [139, 8], [163, 3], [181, 10], [22, 17], [150, 15], [70, 19]].forEach(([x, y], i) =>
    els.push(<rect key={'st' + i} x={x} y={y} width={1} height={1} fill={i % 3 ? '#9b8fb0' : '#f5e6c8'} />));
  // sun
  for (let dy = -12; dy <= 12; dy++) {
    const half = Math.floor(Math.sqrt(144 - dy * dy));
    els.push(<rect key={'sun' + dy} x={128 - half} y={44 + dy} width={half * 2} height={1} fill={dy < -5 ? '#fff0c4' : '#ffd98a'} />);
  }
  // sun glints on the clouds
  [[96, 30, 22], [150, 36, 16], [60, 40, 12]].forEach(([x, y, w], i) => {
    els.push(<rect key={'cl' + i} x={x} y={y} width={w} height={1} fill="#f2a07a" />);
    els.push(<rect key={'cm' + i} x={x + 3} y={y + 1} width={w - 6} height={1} fill="#c9706a" />);
  });
  const layer = (amp: number[], base: number, color: string, key: string) => {
    for (let x = 0; x < W; x++) {
      const top = wave(x + key.length * 40, amp, base);
      els.push(<rect key={key + x} x={x} y={top} width={1} height={GROUND - top} fill={color} />);
    }
  };
  layer([5, 2, 7], 54, '#7a3a58', 'far');
  layer([3, 2, 4], 60, '#4a2a48', 'mid');
  layer([2, 1, 2], 67, '#2a2236', 'near');
  // pines on the near ridge
  [8, 27, 41, 160, 176, 186].forEach((x, i) => {
    const t = wave(x + 4 * 40, [2, 1, 2], 67);
    for (let r = 0; r < 7; r++) els.push(<rect key={`p${i}-${r}`} x={x - Math.floor(r / 2)} y={t - 7 + r} width={Math.floor(r / 2) * 2 + 1} height={1} fill="#1a1724" />);
  });
  els.push(<rect key="g" x={0} y={GROUND} width={W} height={H - GROUND} fill="#243b2c" />);
  els.push(<rect key="g2" x={0} y={GROUND} width={W} height={2} fill="#3f6a3e" />);
  for (let x = 3; x < W; x += 11) els.push(<rect key={'gr' + x} x={x} y={GROUND + 5 + (x % 3) * 3} width={2} height={1} fill="#355a36" />);
  for (let x = 56; x < 136; x++) els.push(<rect key={'path' + x} x={x} y={GROUND + 9 + Math.round(Math.sin(x / 9) * 1.5)} width={1} height={2} fill="#4a3f33" />);
  return els;
})();

export type SceneState = { heroName?: string; hasHero: boolean; hasHp: boolean; chest: boolean; slime: boolean };

export function GameScene({ s, caption }: { s: SceneState; caption?: string }) {
  return (
    <figure className="game">
      <svg viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" role="img"
        aria-label={s.hasHero ? `Твоя игра: герой ${s.heroName ?? ''} на закате` : 'Твоя игра пока без героя'}>
        {LAND}
        {sprite(CHEST, 34, GROUND - 13, !s.chest, 'c')}
        {sprite(SLIME, 142, GROUND - 13, !s.slime, 's')}
        <g className={s.hasHero ? 'idle' : undefined}>{sprite(HERO, 88, GROUND - 15, !s.hasHero, 'h')}</g>
        {s.hasHero && s.hasHp && <>
          <rect x={86} y={GROUND - 20} width={20} height={3} fill="#120f14" />
          <rect x={87} y={GROUND - 19} width={18} height={1} fill="#7ccf6a" />
        </>}
      </svg>
      <figcaption className="game-cap">
        <span className="game-name">{s.hasHero ? (s.heroName ?? 'Герой') : 'Герой не создан'}</span>
        {caption && <span className="game-meta">{caption}</span>}
      </figcaption>
    </figure>
  );
}
