# Telegram Client на n8n

Telegram клиент с автоматическими рассылками и проактивными сообщениями через Client API.

## Как запустить

### 1. Получите Telegram API credentials

1. Перейдите на [my.telegram.org](https://my.telegram.org)
2. Войдите с помощью номера телефона
3. Перейдите в **API development tools**
4. Создайте приложение и получите:
   - **API ID** (число)
   - **API Hash** (строка)

### 2. Настройте проект

1. Скопируйте файл `.env.example` в `.env`
2. Заполните данные Telegram:
   ```env
   TELEGRAM_API_ID=ваш_api_id
   TELEGRAM_API_HASH=ваш_api_hash
   TELEGRAM_PHONE=+79001234567
   ```
3. Получите токен ngrok на [ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)
4. Вставьте токен ngrok в `.env`

### 3. Запустите проект

```bash
docker compose up -d
```

**При первом запуске:**
- Сервис попросит ввести код из SMS
- Подключитесь к контейнеру: `docker attach telegram-client`
- Введите код из Telegram
- Сессия сохранится автоматически

### 4. Откройте n8n

Перейдите по адресу: [http://localhost:5678](http://localhost:5678)

**Логин:** admin
**Пароль:** admin

### 5. Настройте workflows

1. В n8n нажмите **Settings** → **Import from File**
2. Загрузите файлы из папки `workflows/`
3. В workflows замените Telegram ноды на **HTTP Request** ноды
4. Укажите URL: `http://telegram-client:3000`

## API endpoints

Telegram сервис доступен на `http://localhost:3000`:

- `GET /status` - статус подключения
- `GET /dialogs` - список чатов
- `GET /chat/:chatId/members` - участники чата
- `POST /send` - отправить сообщение

## Остановка проекта

```bash
docker compose down
```

---

Подробная техническая документация в файле `Диаграмма n8n.drawio.pdf`
