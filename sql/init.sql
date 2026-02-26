-- Настройки бота (одна строка, каждая настройка — колонка)
CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    target_channel_id TEXT NOT NULL DEFAULT '@kira_news1',
    target_post_id INTEGER NOT NULL DEFAULT 1,
    greeting_template TEXT NOT NULL DEFAULT 'Привет! 👋',
    registration_link TEXT NOT NULL DEFAULT 'https://example.com/register',
    cta_template TEXT NOT NULL DEFAULT 'Какой у вас запрос на курс?',
    contact_cooldown_hours INTEGER NOT NULL DEFAULT 24,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Вставляем дефолтную строку если таблица пустая
INSERT INTO bot_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- История контактов с пользователями (антиспам)
CREATE TABLE IF NOT EXISTS user_contacts (
    id SERIAL PRIMARY KEY,
    user_chat_id BIGINT NOT NULL,
    channel_id TEXT NOT NULL,
    post_id BIGINT NOT NULL,
    last_contacted_at TIMESTAMP DEFAULT NOW(),
    contact_type VARCHAR(50) DEFAULT 'comment_reply',
    UNIQUE(user_chat_id, channel_id, post_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_contacts_lookup ON user_contacts(user_chat_id, channel_id, post_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_time ON user_contacts(last_contacted_at);
