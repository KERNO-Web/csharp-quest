import { useEffect, useState } from 'react';
import { CodeView, highlight } from '../ui/CodeView';
import { Sprite, HERO, ICONS } from '../ui/pixel';

/* 1. Программа выполняется сверху вниз */
export function RecipeViz() {
  const lines = ['Console.WriteLine("Разбить яйца");', 'Console.WriteLine("Налить молоко");', 'Console.WriteLine("Жарить блины");'];
  const outs = ['Разбить яйца', 'Налить молоко', 'Жарить блины'];
  const [pc, setPc] = useState(0);
  const [auto, setAuto] = useState(false);
  useEffect(() => {
    if (!auto) return;
    if (pc >= lines.length) { setAuto(false); return; }
    const t = setTimeout(() => setPc(p => p + 1), 750);
    return () => clearTimeout(t);
  }, [auto, pc]);
  return (
    <div className="viz px">
      <div className="viz-cap">Компьютер читает рецепт</div>
      <CodeView code={lines.join('\n')} hl={pc < lines.length ? [pc + 1] : []} />
      <div className="console" aria-live="polite">
        {pc === 0 ? <span className="muted">окно консоли пустое</span> : outs.slice(0, pc).map((o, i) => <div key={i} className="type-in">{o}</div>)}
      </div>
      <div className="viz-ctrl">
        <button className="btn small" disabled={pc >= lines.length || auto} onClick={() => setPc(p => p + 1)}>Следующая строка</button>
        <button className="btn small ghost" onClick={() => { setPc(0); setAuto(true); }}>Запустить всё</button>
      </div>
    </div>
  );
}

/* 2. Матрёшка namespace > class > Main > команда */
const LAYERS = [
  { id: 'ns', label: 'namespace MyGame', c: 'var(--yellow)', lines: [3, 4, 13], text: 'Пространство имён — самая большая коробка. Папка с названием MyGame.' },
  { id: 'cl', label: 'class Program', c: 'var(--blue)', lines: [5, 6, 12], text: 'Класс — комната внутри папки. Здесь живут команды.' },
  { id: 'mn', label: 'static void Main()', c: 'var(--pink)', lines: [7, 8, 11], text: 'Main — точка входа. Отсюда программа стартует.' },
  { id: 'cmd', label: 'Console.WriteLine(...)', c: 'var(--green)', lines: [9, 10], text: 'Сами команды. Выполняются сверху вниз.' },
];
const NEST_CODE = 'using System;\n\nnamespace MyGame\n{\n    class Program\n    {\n        static void Main()\n        {\n            Console.WriteLine("Игра");\n            Console.WriteLine("запущена!");\n        }\n    }\n}';

export function NestViz() {
  const [sel, setSel] = useState(0);
  const render = (i: number): React.ReactNode => {
    const L = LAYERS[i];
    if (!L) return null;
    const on = sel === i;
    return (
      <div role="button" tabIndex={0} className={'nest' + (on ? ' on' : '')} style={{ ['--nc' as any]: L.c }}
        onClick={e => { e.stopPropagation(); setSel(i); }} aria-pressed={on}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setSel(i); } }}>
        <span className="nest-label">{L.label}</span>
        {i < LAYERS.length - 1 ? render(i + 1) : <span className="nest-cmd">Игра запущена!</span>}
      </div>
    );
  };
  return (
    <div className="viz px">
      <div className="viz-cap">Нажимай на слои</div>
      <div className="nest-wrap">{render(0)}</div>
      <p className="nest-text" key={sel} style={{ color: LAYERS[sel].c }}>{LAYERS[sel].text}</p>
      <CodeView code={NEST_CODE} hl={LAYERS[sel].lines} />
    </div>
  );
}

/* 3. Переменная как коробка */
const BOX_STEPS = [
  { code: 'int hp;', val: null as string | null, out: null as string | null, text: 'Создали коробку типа int с наклейкой hp. Пока она пустая.' },
  { code: 'hp = 100;', val: '100', out: null, text: 'Положили в коробку 100.' },
  { code: 'hp = 80;', val: '80', out: '100', text: 'Положили 80. Старое значение выкинули: в коробке всегда лежит что-то одно.' },
  { code: 'hp = hp - 30;', val: '50', out: '80', text: 'Сначала справа: взяли 80, отняли 30. Получилось 50, его и положили.' },
];
export function BoxViz() {
  const [i, setI] = useState(0);
  const s = BOX_STEPS[i];
  return (
    <div className="viz px">
      <div className="viz-cap">Коробка hp</div>
      <CodeView code={BOX_STEPS.map(b => b.code).join('\n')} hl={[i + 1]} />
      <div className="boxstage">
        <div className="vbox" key={'b' + i}>
          {s.out && <span className="vval out" key={'o' + i}>{s.out}</span>}
          {s.val && <span className="vval in" key={'v' + i}>{s.val}</span>}
          <div className="vbox-front"><span className="vtag">int</span><span className="vname">hp</span></div>
        </div>
      </div>
      <p className="nest-text">{s.text}</p>
      <div className="viz-ctrl">
        <button className="btn small" disabled={i >= BOX_STEPS.length - 1} onClick={() => setI(i + 1)}>Следующая строка</button>
        <button className="btn small ghost" onClick={() => setI(0)}>Сначала</button>
      </div>
    </div>
  );
}

/* 4. Анатомия строки int hp = 100; */
const WRITELINE_PARTS: Part[] = [
  { t: 'Console', c: 'var(--blue)', name: 'Console', text: 'Консоль — окно, куда программа пишет текст. Это наш «экран».' },
  { t: '.', c: 'var(--muted)', name: 'Точка', text: '«Возьми у него». Console.WriteLine = «у консоли возьми команду WriteLine».' },
  { t: 'WriteLine', c: 'var(--yellow)', name: 'WriteLine', text: 'Write — напиши, Line — строку. Пишет текст и переводит курсор на новую строку.' },
  { t: '(', c: 'var(--muted)', name: 'Скобки', text: 'В скобках то, что отдаём команде. Здесь — что написать.' },
  { t: '"Привет!"', c: 'var(--peach)', name: 'Текст в кавычках', text: 'Кавычки говорят: это просто текст, напечатай его буква в букву.' },
  { t: ')', c: 'var(--muted)', name: 'Скобки', text: 'Закрыли скобку: всё, что нужно команде, передали.' },
  { t: ';', c: 'var(--yellow)', name: 'Точка с запятой', text: 'Конец команды. Как точка в конце предложения.' },
];
export const ANATOMY_PRESETS: Record<string, Part[]> = { writeline: WRITELINE_PARTS };

const PARTS: Part[] = [
  { t: 'int', c: 'var(--blue)', name: 'Тип', text: 'Форма коробки. int — только целые числа.' },
  { t: 'hp', c: 'var(--text)', name: 'Имя', text: 'Наклейка на коробке. По этому имени потом достаём значение.' },
  { t: '=', c: 'var(--muted)', name: 'Присваивание', text: '«Положи в». Не «равно»!' },
  { t: '100', c: 'var(--orange)', name: 'Значение', text: 'То, что кладём в коробку.' },
  { t: ';', c: 'var(--yellow)', name: 'Конец команды', text: 'Точка в конце предложения. Без неё компилятор ругается.' },
];
type Part = { t: string; c: string; name: string; text: string };
export function AnatomyViz({ parts = PARTS, caption = 'Нажимай на части' }: { parts?: Part[]; caption?: string }) {
  const [sel, setSel] = useState<number | null>(null);
  const PARTS_ = parts;
  return (
    <div className="viz px">
      <div className="viz-cap">{caption}</div>
      <div className="anat">
        {PARTS_.map((p, i) => (
          <button type="button" key={i} className={'anat-part' + (sel === i ? ' on' : '')} style={{ color: p.c, ['--ac' as any]: p.c }} onClick={() => setSel(i)}>{p.t}</button>
        ))}
      </div>
      <div className="anat-info" key={sel ?? -1}>
        {sel === null ? <span className="muted">Тут появится объяснение</span> : <><b style={{ color: PARTS_[sel].c }}>{PARTS_[sel].name}.</b> {PARTS_[sel].text}</>}
      </div>
    </div>
  );
}

/* 5. Область видимости — комнаты */
const SCOPE_CODE = 'int gold = 10;\n{\n    int bonus = 5;\n    Console.WriteLine(gold + bonus);\n}\nConsole.WriteLine(gold);';
const VISIBLE: Record<number, string[]> = { 1: ['gold'], 2: ['gold'], 3: ['gold', 'bonus'], 4: ['gold', 'bonus'], 5: ['gold', 'bonus'], 6: ['gold'] };
export function ScopeViz() {
  const [line, setLine] = useState(4);
  const vis = VISIBLE[line] ?? [];
  return (
    <div className="viz px">
      <div className="viz-cap">Нажми на строку: какие коробки отсюда видно?</div>
      <CodeView code={SCOPE_CODE} onLine={setLine}
        lineClass={n => [n === line ? 'pick' : '', n >= 2 && n <= 5 ? 'room' : ''].join(' ')} />
      <div className="scope-boxes">
        {['gold', 'bonus'].map(v => (
          <div key={v} className={'sbox' + (vis.includes(v) ? '' : ' gone')}>
            <Sprite rows={ICONS.box} size={40} />
            <span className="mono">{v}</span>
            <span className="sbox-st">{vis.includes(v) ? 'видно' : 'не видно'}</span>
          </div>
        ))}
      </div>
      <p className="nest-text">{line >= 2 && line <= 5 ? 'Ты внутри комнаты { }. Видно и свою коробку, и ту, что снаружи.' : 'Ты снаружи комнаты. Коробка bonus осталась внутри и отсюда не видна.'}</p>
    </div>
  );
}

/* 6. Перед боссом */
export function BossIntroViz() {
  const ghost = HERO.map(r => r.replace(/[^.]/g, 'l'));
  return (
    <div className="viz px boss-intro">
      <div className="viz-cap">Мастерская: слот героя</div>
      <div className="boss-ghost"><Sprite rows={ghost} size={96} /><span className="q">???</span></div>
      <p className="nest-text">Герой ещё не создан. Его создаст твой код.</p>
    </div>
  );
}

export const VIZ: Record<string, (p: any) => React.ReactNode> = {
  recipe: RecipeViz, nest: NestViz, box: BoxViz, anatomy: AnatomyViz,
  writeline: () => <AnatomyViz parts={WRITELINE_PARTS} caption="Нажимай на каждую часть команды" />, scope: ScopeViz, bossIntro: BossIntroViz,
};

export { highlight };
