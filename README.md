# JWT WebSocket Chat

Simple website with JWT authentication and a real-time chat using WebSockets.

## Запуск

1. Установи зависимости:

   ```bash
   npm install
   ```

2. Запусти сервер:

   ```bash
   npm start
   ```

3. Открой в браузере:

   ```text
   http://localhost:3000
   ```

## Релиз на хостинг

Для продакшн-развертывания нужно установить переменные окружения:

- `JWT_SECRET` — секрет для подписи JWT
- `PORT` — порт сервера (по умолчанию `3000`)
- `NODE_ENV=production` — опционально для среды запуска

Пример для хостинга на Node:

```bash
npm install
export JWT_SECRET="super_secret"
export PORT=3000
npm start
```

Если нужно разместить с Docker:

```bash
docker build -t jwt-ws-chat .
docker run -e JWT_SECRET="super_secret" -p 3000:3000 jwt-ws-chat
```

## Размещение на GitLab Pages

Этот проект нельзя полностью запустить на GitLab Pages, потому что Pages поддерживает только статические файлы.

Однако можно разместить фронтенд на GitLab Pages и подключить к отдельному бэкенду, запущенному на другом хостинге.

1. Залей весь проект в GitLab репозиторий.
2. Файл `.gitlab-ci.yml` автоматически опубликует содержимое `public/` на Pages при ветке `main`.
3. Обнови `public/config.js` перед деплоем, указав адреса бэкенда:

```js
window.CONFIG = {
  api: 'https://your-backend.example',
  ws: 'your-backend.example',
};
```

4. Фронтенд на Pages будет обращаться к API и WebSocket на другом сервере.

### Пример URL

Если backend доступен по `https://chat-api.example`, то `config.js` должен быть:

```js
window.CONFIG = {
  api: 'https://chat-api.example',
  ws: 'chat-api.example',
};
```

> Если хочешь, можно настроить `backend` и `ws` через query-параметры: `?backend=https://chat-api.example&ws=chat-api.example`.
