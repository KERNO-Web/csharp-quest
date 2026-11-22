import { useEffect, useState } from 'react';
import { Lesson } from './lesson/Lesson';
import { MapScreen } from './screens/MapScreen';
import { Workshop } from './screens/Workshop';
import { Deck } from './screens/Deck';
import { Settings } from './screens/Settings';
import { useSync } from './state/progress';
import { warmUp } from './runner/runner';

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

  const tabs: [string, string][] = [['map', 'Карта'], ['workshop', 'Мастерская'], ['deck', 'Колода']];
  return (
    <>
      <header className="bar">
        <button className="logo" onClick={() => go('#/map')}>C<span>#</span>Quest</button>
        {tabs.map(([r, label]) => (
          <button key={r} className="tab" aria-current={route === r ? 'page' : undefined} onClick={() => go('#/' + r)}>{label}</button>
        ))}
        <button className="tab gear" aria-current={route === 'settings' ? 'page' : undefined} onClick={() => go('#/settings')} aria-label="Настройки и синхронизация">
          <span className={'sync-dot ' + sync.status} aria-hidden />
          <svg width="18" height="18" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden><path fill="currentColor" d="M3 0h3v1h1v1h1v1h1v3H8v1H7v1H6v1H3V8H2V7H1V6H0V3h1V2h1V1h1zM3 3v3h3V3z" /></svg>
        </button>
      </header>
      {route === 'workshop' ? <Workshop go={go} />
        : route === 'deck' ? <Deck go={go} />
        : route === 'settings' ? <Settings />
        : <MapScreen go={go} />}
    </>
  );
}
