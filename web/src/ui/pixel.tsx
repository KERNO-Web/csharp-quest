import type { ReactElement } from 'react';
// Tiny pixel-art sprites drawn from text rows. One char = one pixel.
const PAL: Record<string, string> = {
  k: '#000000', w: '#fff1e8', y: '#ffec27', o: '#ffa300', r: '#ff004d', g: '#00e436', G: '#008751',
  b: '#29adff', B: '#1d2b53', p: '#ff77a8', e: '#ffccaa', n: '#ab5236', u: '#7e2553', d: '#83769c',
  m: '#c2c3c7', l: '#3b4a85', s: '#5f574f',
};

export function Sprite({ rows, size = 48, className, title }: { rows: string[]; size?: number; className?: string; title?: string }) {
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === '.' || !PAL[c]) { x++; continue; }
      let run = 1;
      while (row[x + run] === c) run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={PAL[c]} />);
      x += run;
    }
  });
  return (
    <svg className={className} width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {rects}
    </svg>
  );
}

export const ICONS: Record<string, string[]> = {
  scroll: [
    '.nnnnnnnnnn.',
    'neeeeeeeeeen',
    '.nwwwwwwwwn.',
    '.nwkkkkkkwn.',
    '.nwwwwwwwwn.',
    '.nwkkkkwwwn.',
    '.nwwwwwwwwn.',
    '.nwkkkkkwwn.',
    '.nwwwwwwwwn.',
    '.nwkkkwwwwn.',
    'neeeeeeeeeen',
    '.nnnnnnnnnn.',
  ],
  chip: [
    '............',
    '...bb..bb...',
    '..b......b..',
    '..b......b..',
    '..b..yy..b..',
    '.b...yy...b.',
    '.b........b.',
    '..b..yy..b..',
    '..b..yy..b..',
    '..b......b..',
    '...bb..bb...',
    '............',
  ],
  owl: [
    '.n........n.',
    '.nn......nn.',
    '.nnnnnnnnnn.',
    'nnwwwnnwwwnn',
    'nwwkwwwwkwwn',
    'nnwwwnnwwwnn',
    '.nnnnoonnnn.',
    '.nneeooeenn.',
    '.neeeeeeeen.',
    '.nneeeeeenn.',
    '..nnnnnnnn..',
    '...o.oo.o...',
  ],
  folder: [
    '............',
    '.yyyy.......',
    'yooooy......',
    'yooooyyyyyy.',
    'yyyyyyyyyyyy',
    'yooooooooooy',
    'yowwwwwwwwoy',
    'yooooooooooy',
    'yowwwwwwwwoy',
    'yooooooooooy',
    'yyyyyyyyyyyy',
    '............',
  ],
  house: [
    '.....rr.....',
    '....rrrr....',
    '...rrrrrr...',
    '..rrrrrrrr..',
    '.rrrrrrrrrr.',
    'rrrrrrrrrrrr',
    '.eeeeeeeeee.',
    '.ebbeeeennn.',
    '.ebbeeeennn.',
    '.eeeeeeennn.',
    '.eeeeeeennn.',
    'GGGGGGGGGGGG',
  ],
  door: [
    '..ssssssss..',
    '.snnnnnnnns.',
    '.snnnnnnnns.',
    '.snkknnkkns.',
    '.snnnnnnnns.',
    '.snnnnnnyns.',
    '.snnnnnnyns.',
    '.snnnnnnnns.',
    '.snkknnkkns.',
    '.snnnnnnnns.',
    '.snnnnnnnns.',
    'gggggggggggg',
  ],
  toolbox: [
    '............',
    '....kkkk....',
    '...k....k...',
    '.rrrrrrrrrr.',
    'rrrrrrrrrrrr',
    'rrrrryyrrrrr',
    'rrrrryyrrrrr',
    'rrrrrrrrrrrr',
    'rrrrrrrrrrrr',
    'rrrrrrrrrrrr',
    '.rrrrrrrrrr.',
    '............',
  ],
  box: [
    '............',
    '..nnnnnnnn..',
    '.neeeeeeeen.',
    'nnnnnnnnnnnn',
    'neeeeeeeeeen',
    'neewwwwwween',
    'neewkkkkween',
    'neewwwwwween',
    'neeeeeeeeeen',
    'neeeeeeeeeen',
    'nnnnnnnnnnnn',
    '............',
  ],
  shapes: [
    '............',
    '.bbbb...pp..',
    '.bbbb..pppp.',
    '.bbbb.pppppp',
    '.bbbb.pppppp',
    '.......pppp.',
    '...yy...pp..',
    '..yyyy......',
    '.yyyyyy.ggg.',
    'yyyyyyyyggg.',
    '........ggg.',
    '............',
  ],
  arrow: [
    '............',
    '............',
    '.......y....',
    '.......yy...',
    'yyyyyyyyyy..',
    'yyyyyyyyyyy.',
    'yyyyyyyyyy..',
    '.......yy...',
    '.......y....',
    '............',
    '..nnnnnnnn..',
    '..neeeeeen..',
  ],
  eye: [
    '............',
    '............',
    '....wwww....',
    '..wwwwwwww..',
    '.wwwbbbbwww.',
    'wwwbbkkbbwww',
    'wwwbbkkbbwww',
    '.wwwbbbbwww.',
    '..wwwwwwww..',
    '....wwww....',
    '............',
    '............',
  ],
  note: [
    '............',
    '.yyyyyyyyy..',
    '.yyyyyyyyy..',
    '.ykkkkkyyy..',
    '.yyyyyyyyy..',
    '.ykkkkkkky..',
    '.yyyyyyyyy..',
    '.ykkkkyyyy..',
    '.yyyyyyyyy..',
    '.yyyyyyyoo..',
    '.yyyyyyoo...',
    '............',
  ],
};

export const HERO = [
  '................',
  '.....kkkkkk.....',
  '....kyyyyyyk....',
  '...kyyyyyyyyk...',
  '...keeeeeeeek...',
  '...kekkeekkek...',
  '...keeeeeeeek...',
  '....keeppeek....',
  '....kkbbbbkk....',
  '...kebbbbbbek...',
  '..keebbbbbbeek..',
  '..kkkbyyyybkkk..',
  '....kbbbbbbk....',
  '....knnkknnk....',
  '....knnk.knnk...',
  '...kkkk..kkkk...',
];

export const SLIME = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '......kkkk......',
  '....kkggggkk....',
  '...kgggwwgggk...',
  '..kggggwwggggk..',
  '..kggkggggkggk..',
  '.kgggkggggkgggk.',
  '.kgggggggggggggk',
  '.kGgggggggggggGk',
  '..kGGGGGGGGGGGk.',
  '...kkkkkkkkkkk..',
  '................',
];

export const CHEST = [
  '................',
  '................',
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '.knnnnnnnnnnnnk.',
  '.knooooooooooon.',
  '.kkkkkkkkkkkkkk.',
  '.knnnnnyynnnnnk.',
  '.knnnnnyynnnnnk.',
  '.knnnnnnnnnnnnk.',
  '.knooooooooooonk',
  '.kkkkkkkkkkkkkk.',
  '................',
  '................',
  '................',
];

export function Icon({ name, size = 44 }: { name?: string; size?: number }) {
  const rows = (name && ICONS[name]) || ICONS.box;
  return <Sprite rows={rows} size={size} />;
}
