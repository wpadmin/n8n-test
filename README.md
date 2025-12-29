# Telegram Client Bot для автоматических ответов на комментарии

Бот автоматически отправляет сообщения пользователям, которые оставили комментарии под постами в канале.

## Быстрый старт

### 1. Получи Telegram API credentials

1. Открой https://my.telegram.org
2. API development tools → Создай приложение
3. Скопируй API ID и API Hash

### 2. Настрой окружение

```bash
cp .env.example .env
```

Заполни `.env`:
```env
TELEGRAM_API_ID=твой_api_id
TELEGRAM_API_HASH=твой_api_hash
TELEGRAM_PHONE=+79001234567
NGROK_AUTHTOKEN=твой_ngrok_token (опционально)
```

### 3. Запусти контейнеры

```bash
docker compose up -d
```

**Первый запуск - аутентификация:**
```bash
docker attach n8n-test-telegram-client-1
# Введи код из Telegram
# Нажми Ctrl+P Ctrl+Q чтобы отключиться без остановки контейнера
```

### 4. Настрой n8n

Открой http://localhost:5678 (admin / admin)

**Настрой PostgreSQL credentials:**
1. Settings → Credentials → New
2. Выбери Postgres
3. Заполни:
   - Host: `postgres`
   - Database: `n8n`
   - User: `n8n`
   - Password: `n8n`

**Инициализируй базу данных:**
```bash
docker exec -i n8n-test-postgres-1 psql -U n8n -d n8n < sql/init.sql
```

### 5. Импортируй и настрой workflow

**Импорт:**
1. В n8n: Add workflow → Import from File
2. Выбери `workflows/channel-auto-parser.json`
3. Save

**Настройка workflow:**
1. Открой workflow "Автопарсинг всего канала"
2. В ноде "Получить комментарии" укажи свой канал и пост (или оставь `@kira_news1/1269` для теста)
3. Привяжи PostgreSQL credentials ко всем нодам с БД
4. Save

**Настрой шаблоны сообщений:**

1. Импортируй `workflows/bot-settings-manager.json`
2. Открой workflow "Управление настройками бота"
3. В ноде "Задать настройки" измени значения:
   - `greeting_template` - текст приветствия
   - `registration_link` - ссылка на регистрацию
   - `cta_template` - призыв к действию
   - `contact_cooldown_hours` - часы между повторными сообщениями
4. Нажми "Execute Workflow" - настройки сохранятся в БД
5. Готово! Теперь бот будет использовать эти шаблоны

### 6. Активируй workflow

1. Включи переключатель **Active** в правом верхнем углу
2. Save
3. Workflow запускается каждые 30 секунд

## Как работает

1. Каждые 30 секунд workflow проверяет комментарии в указанном посте
2. Для каждого нового комментария:
   - Проверяет не отправляли ли уже сообщение этому пользователю (антиспам)
   - Отправляет сообщение: приветствие + ссылка + CTA
   - Сохраняет запись в `user_contacts` чтобы не писать повторно

## API микросервиса

`http://localhost:3000`:

- `GET /channel/:channelId/post/:postId/comments` - получить комментарии к посту
- `POST /send` - отправить сообщение пользователю

**Пример:**
```bash
# Получить комментарии
curl http://localhost:3000/channel/@kira_news1/post/1269/comments

# Отправить сообщение
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"userId": "username", "message": "Привет!"}'
```

## Управление

**Остановка:**
```bash
docker compose down
```

**Логи:**
```bash
docker logs n8n-test-telegram-client-1 -f
docker logs n8n-test-n8n-1 -f
```

**Очистить антиспам (для повторного теста):**
```bash
docker exec -i n8n-test-postgres-1 psql -U n8n -d n8n -c "DELETE FROM user_contacts;"
```
