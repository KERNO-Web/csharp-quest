import { useState } from 'react';
import { connect, disconnect, getToken, pull, resetAll, useSync } from '../state/progress';

export function Settings() {
  const sync = useSync();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const has = !!getToken();

  return (
    <main className="page">
      <h1 className="h1">Синхронизация</h1>
      <p className="lead">Чтобы прогресс был один на телефоне и компьютере, он хранится в твоём секретном Gist на GitHub. Ключ вводится один раз на каждом устройстве.</p>

      <div className="px" style={{ padding: 18 }}>
        <div className="sync-line">
          <span className={'sync-dot big ' + sync.status} />
          <span>
            {sync.status === 'off' && 'Не подключено. Прогресс хранится только на этом устройстве.'}
            {sync.status === 'syncing' && 'Синхронизирую…'}
            {sync.status === 'ok' && 'Подключено. Прогресс сохраняется в GitHub.'}
            {sync.status === 'error' && <>Ошибка: {sync.message}</>}
          </span>
        </div>

        {!has ? (<>
          <ol className="howto">
            <li>Открой <a href="https://github.com/settings/tokens/new?scopes=gist&description=C%23%20Quest" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>страницу нового ключа на GitHub</a> (галочка <b>gist</b> уже стоит).</li>
            <li>В поле Expiration выбери <b>No expiration</b> или 90 дней.</li>
            <li>Нажми <b>Generate token</b> внизу и скопируй ключ (начинается с <code>ghp_</code>).</li>
            <li>Вставь его сюда. На втором устройстве сделай то же с тем же ключом.</li>
          </ol>
          <div className="field">
            <label htmlFor="tok">Ключ GitHub</label>
            <input id="tok" type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_…" />
          </div>
          <button className="btn" disabled={!token.trim() || busy} onClick={async () => { setBusy(true); await connect(token); setBusy(false); setToken(''); }}>
            {busy ? 'Подключаю…' : 'Подключить'}
          </button>
          <p className="note">Ключ хранится только в этом браузере. Ему хватает права на Gist, к твоим репозиториям он доступа не даёт.</p>
        </>) : (
          <div className="viz-ctrl">
            <button className="btn small" onClick={() => pull()}>Синхронизировать сейчас</button>
            <button className="btn small ghost" onClick={() => disconnect()}>Отключить на этом устройстве</button>
          </div>
        )}
      </div>

      <h2 className="h2" style={{ marginTop: 40 }}>Сброс</h2>
      <p className="note">Удалит весь прогресс на этом устройстве (и в Gist, если подключён).</p>
      <button className="btn small pink" onClick={() => { if (confirm('Точно стереть весь прогресс?')) resetAll(); }}>Стереть прогресс</button>
    </main>
  );
}
