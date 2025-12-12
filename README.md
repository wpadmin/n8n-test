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

**Базовые:**
- `client-api-get-dialogs.json` - получить список чатов
- `client-api-send-message.json` - отправить сообщение через webhook
- `client-api-broadcast.json` - рассылка участникам чата

**Для работы с комментариями:**
- `bot-settings-manager.json` - управление настройками (шаблоны, ID канала, cooldown)
- `channel-comments-parser.json` - парсинг комментариев конкретного поста
- `channel-auto-parser.json` - автопарсинг всех постов канала (рекомендуется)

### 6. Настрой бота

1. Открой workflow **"Управление настройками бота"**
2. В ноде **"Задать настройки"** укажи:
   - `target_channel_id` - ID или username канала (@kira_news1)
   - `greeting_template` - текст приветствия
   - `registration_link` - ссылка на регистрацию
   - `cta_template` - призыв к действию
   - `contact_cooldown_hours` - период повторной отправки (часы)
3. Запусти workflow - настройки сохранятся в БД
4. Активируй workflow **"Автопарсинг всего канала"** (запускается каждые 5 мин)

**Варианты использования:**
- `channel-auto-parser.json` - автоматически парсит все посты с комментариями (рекомендуется)
- `channel-comments-parser.json` - парсит только один конкретный пост (нужно указать `target_post_id` в настройках)

## API микросервиса

`http://localhost:3000`:

**Базовые:**
- `GET /dialogs` - список чатов
- `GET /chat/:id/members` - участники чата
- `POST /send` - отправить сообщение

**Комментарии:**
- `GET /channel/:channelId/posts` - посты канала с комментариями
- `GET /channel/:channelId/post/:postId/comments` - комментарии к конкретному посту

**Примеры:**

```bash
# Отправить сообщение
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "username", "message": "Hello"}'

# Получить посты канала с комментариями
curl http://localhost:3000/channel/@kira_news1/posts

# Получить комментарии к конкретному посту
curl http://localhost:3000/channel/@kira_news1/post/123/comments
```

## Остановка

```bash
docker compose down
```
