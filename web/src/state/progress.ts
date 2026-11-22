import { useSyncExternalStore } from 'react';

// Progress lives in localStorage and, if a GitHub token is set, in a secret Gist (one file).
export type Progress = {
  v: 1;
  done: Record<string, number>;          // levelId -> finished at (ms)
  cards: string[];                       // collected term ids
  hero: { name?: string; hp?: number; level?: number; at?: number };
  codes: Record<string, string>;         // last code per code step
  xp: number;
  updatedAt: number;
};

const KEY = 'csq.progress.v1';
const TOKEN = 'csq.gh.token';
const GIST = 'csq.gh.gist';
const FILE = 'csharp-quest-progress.json';

const empty = (): Progress => ({ v: 1, done: {}, cards: [], hero: {}, codes: {}, xp: 0, updatedAt: 0 });

function load(): Progress {
  try { const raw = localStorage.getItem(KEY); if (raw) return { ...empty(), ...JSON.parse(raw) }; } catch { /* private mode */ }
  return empty();
}

let state = load();
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

function save(p: Progress, push = true) {
  state = p;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  emit();
  if (push) schedulePush();
}

export function useProgress() {
  return useSyncExternalStore(f => { subs.add(f); return () => subs.delete(f); }, () => state);
}
export const getProgress = () => state;

export function update(fn: (p: Progress) => Progress) {
  save({ ...fn(structuredClone(state)), updatedAt: Date.now() });
}

export function finishLevel(levelId: string, cards: string[], xp: number) {
  update(p => {
    const first = !p.done[levelId];
    p.done[levelId] = p.done[levelId] || Date.now();
    p.cards = [...new Set([...p.cards, ...cards])];
    if (first) p.xp += xp;
    return p;
  });
}

export function merge(a: Progress, b: Progress): Progress {
  const done = { ...a.done };
  for (const [k, v] of Object.entries(b.done)) done[k] = done[k] ? Math.min(done[k], v) : v;
  const newer = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  const older = newer === a ? b : a;
  return {
    v: 1, done,
    cards: [...new Set([...a.cards, ...b.cards])],
    hero: (a.hero.at || 0) >= (b.hero.at || 0) ? a.hero : b.hero,
    codes: { ...older.codes, ...newer.codes },
    xp: Math.max(a.xp, b.xp),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

// ---------------- GitHub Gist sync ----------------
export type SyncState = { status: 'off' | 'syncing' | 'ok' | 'error'; message?: string; at?: number };
let sync: SyncState = { status: getToken() ? 'ok' : 'off' };
const syncSubs = new Set<() => void>();
function setSync(s: SyncState) { sync = s; syncSubs.forEach(f => f()); }
export function useSync() {
  return useSyncExternalStore(f => { syncSubs.add(f); return () => syncSubs.delete(f); }, () => sync);
}

export function getToken() { try { return localStorage.getItem(TOKEN) || ''; } catch { return ''; } }
function getGistId() { try { return localStorage.getItem(GIST) || ''; } catch { return ''; } }

async function gh(path: string, init: RequestInit = {}) {
  const r = await fetch('https://api.github.com' + path, {
    ...init,
    headers: { Authorization: 'Bearer ' + getToken(), Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  if (!r.ok) throw new Error(r.status === 401 ? 'Ключ не подошёл (401). Проверь, что скопировал целиком.' : r.status === 403 || r.status === 404 ? 'У ключа нет права на Gist.' : 'GitHub ответил ' + r.status);
  return r.json();
}

async function findGist(): Promise<string> {
  const known = getGistId();
  if (known) return known;
  for (let page = 1; page <= 5; page++) {
    const list: any[] = await gh(`/gists?per_page=100&page=${page}`);
    const hit = list.find(g => g.files && g.files[FILE]);
    if (hit) { localStorage.setItem(GIST, hit.id); return hit.id; }
    if (list.length < 100) break;
  }
  const created = await gh('/gists', { method: 'POST', body: JSON.stringify({ description: 'C# Quest progress', public: false, files: { [FILE]: { content: JSON.stringify(state) } } }) });
  localStorage.setItem(GIST, created.id);
  return created.id;
}

export async function pull() {
  if (!getToken()) return;
  setSync({ status: 'syncing' });
  try {
    const id = await findGist();
    const g = await gh('/gists/' + id);
    const file = g.files?.[FILE];
    let remote: Progress | null = null;
    if (file?.truncated && file.raw_url) remote = await fetch(file.raw_url).then(r => r.json());
    else if (file?.content) remote = JSON.parse(file.content);
    if (remote) save(merge(state, { ...empty(), ...remote }), false);
    await push();
  } catch (e: any) {
    setSync({ status: 'error', message: e.message });
  }
}

let pushTimer: number | undefined;
function schedulePush() {
  if (!getToken()) return;
  clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => { push(); }, 2500);
}

export async function push() {
  if (!getToken()) return;
  setSync({ status: 'syncing' });
  try {
    const id = await findGist();
    await gh('/gists/' + id, { method: 'PATCH', body: JSON.stringify({ files: { [FILE]: { content: JSON.stringify(state) } } }) });
    setSync({ status: 'ok', at: Date.now() });
  } catch (e: any) {
    setSync({ status: 'error', message: e.message });
  }
}

export async function connect(token: string) {
  localStorage.setItem(TOKEN, token.trim());
  localStorage.removeItem(GIST);
  await pull();
  return sync;
}

export function disconnect() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(GIST);
  setSync({ status: 'off' });
}

export function resetAll() {
  save(empty());
}

// pull on start and when the tab comes back
if (typeof window !== 'undefined') {
  if (getToken()) pull();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); });
}
