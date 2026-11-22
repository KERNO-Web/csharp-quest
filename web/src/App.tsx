import { useEffect, useState } from 'react';
import { Lesson } from './lesson/Lesson';
import { MapScreen } from './screens/MapScreen';
import { Workshop } from './screens/Workshop';
import { Deck } from './screens/Deck';
import { Settings } from './screens/Settings';
import { useSync } from './state/progress';
import { warmUp } from './runner/runner';
import { Map as MapIcon, Hammer, Layers, Settings as Gear } from 'lucide-react';

function useHash() {
  const [h, setH] = useState(() => location.hash || '#/map');
  useEffect(() => {
    const f = () => setH(location.hash || '#/map');
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return h;
}

export default function App() {
  const hash = useHash();
  // wake the C# compiler in the background so the first code task doesn't wait
  useEffect(() => {
    const t = setTimeout(() => {
      const idle = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200));
      idle(() => warmUp());
    }, 2500);
    return () => clearTimeout(t);
  }, []);
  const go = (h: string) => { location.hash = h; };
  const sync = useSync();
  const [, route, arg] = hash.split('/');

  if (route === 'l' && arg) return <Lesson key={arg} id={arg} go={go} />;

  const tabs: [string, string, typeof MapIcon][] = [['map', 'Карта', MapIcon], ['workshop', 'Мастерская', Hammer], ['deck', 'Колода', Layers]];
  return (
    <>
      <header className="bar"><div className="bar-in">
        <button className="logo" onClick={() => go('#/map')}><span className="logo-mark">C#</span>Quest</button>
        {tabs.map(([r, label, Ico]) => (
          <button key={r} className="tab" aria-current={route === r || (!route && r === 'map') ? 'page' : undefined} onClick={() => go('#/' + r)} aria-label={label}>
            <Ico size={16} strokeWidth={1.5} /><span className="tab-label">{label}</span>
          </button>
        ))}
        <button className="tab" aria-current={route === 'settings' ? 'page' : undefined} onClick={() => go('#/settings')} aria-label="Синхронизация">
          <span className={'sync-dot ' + sync.status} aria-hidden /><Gear size={16} strokeWidth={1.5} />
        </button>
      </div></header>
      {route === 'workshop' ? <Workshop go={go} />
        : route === 'deck' ? <Deck go={go} />
        : route === 'settings' ? <Settings />
        : <MapScreen go={go} />}
    </>
  );
}
