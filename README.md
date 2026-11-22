# C# Quest

Личный тренажёр по C# на 21 тему первого семестра: короткие уровни, термины карточками, настоящий компилятор C# прямо в браузере, своя пиксельная игра растёт по мере прохождения.

- `web/` — приложение (Vite + React). Запуск: `npm --prefix web run dev` → http://localhost:5195
- `runner/` — компилятор: .NET 10 + Roslyn в WebAssembly. Пересборка: `dotnet publish runner -c Release -o .work/runner-pub`, затем скопировать `wwwroot/_framework` в `web/public/runner/`.
- `web/src/course/` — содержание. Одна тема = один файл (`t01.ts`), подключается в `course.ts`.
- Спека: `docs/SPEC.md`.

Деплой: push в `main` → GitHub Actions → Pages. Прогресс хранится в localStorage и в секретном Gist пользователя (ключ вводится в настройках).
