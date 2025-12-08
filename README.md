# Telegram Client на n8n

Telegram клиент с проактивными рассылками через Client API.

## Запуск

### 1. Получи API credentials

1. Зайди на [my.telegram.org](https://my.telegram.org)
2. API development tools → Создай приложение
3. Скопируй **API ID** и **API Hash**

### 2. Настрой .env

```bash
cp .env.example .env
```

Заполни:
```env
TELEGRAM_API_ID=твой_api_id
TELEGRAM_API_HASH=твой_api_hash
TELEGRAM_PHONE=+79001234567
NGROK_AUTHTOKEN=твой_ngrok_token
```

### 3. Запусти

```bash
docker compose up -d
```

**Первый запуск (аутентификация в Telegram):**

Просто закрой терминал после ввода кода - контейнер продолжит работать в фоне.

### 4. Открой n8n

http://localhost:5678 (admin / admin)

### 5. Импортируй workflows

Импортируй файлы из `workflows/`:
- `client-api-get-dialogs.json` - получить список чатов
- `client-api-send-message.json` - отправить сообщение через webhook
- `client-api-broadcast.json` - рассылка участникам чата

## API микросервиса

`http://localhost:3000`:

- `GET /dialogs` - список чатов
- `GET /chat/:id/members` - участники чата
- `POST /send` - отправить сообщение

**Пример:**
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "username", "message": "Hello"}'
```

## Остановка

```bash
docker compose down
```
