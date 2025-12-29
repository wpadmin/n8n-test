# Telegram Client API Service

Микросервис для работы с Telegram Client API через HTTP endpoints.

## API Endpoints

### Health Check
```
GET /health
Response: { "status": "ok", "initialized": true }
```

### Статус подключения
```
GET /status
Response: { "connected": true, "initialized": true }
```

### Получить список чатов
```
GET /dialogs?limit=100
Response: { "dialogs": [...] }
```

### Получить участников чата
```
GET /chat/:chatId/members?limit=100
Response: { "members": [...] }
```

### Получить сообщения
```
GET /chat/:chatId/messages?limit=100
Response: { "messages": [...] }
```

### Отправить сообщение
```
POST /send
Body: { "userId": "123456", "message": "Hello!" }
Response: { "success": true, "messageId": 123 }
```

## Локальная разработка

```bash
npm install
npm run dev
```

## Docker

```bash
docker build -t telegram-client .
docker run -p 3000:3000 telegram-client
```
