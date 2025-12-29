-- Настройки бота (шаблоны сообщений, периоды повторной отправки)
CREATE TABLE IF NOT EXISTS bot_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- История контактов с пользователями (антиспам)
CREATE TABLE IF NOT EXISTS user_contacts (
    id SERIAL PRIMARY KEY,
    user_chat_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    last_contacted_at TIMESTAMP DEFAULT NOW(),
    contact_type VARCHAR(50) DEFAULT 'comment_reply',
    UNIQUE(user_chat_id, channel_id, post_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_user_contacts_lookup ON user_contacts(user_chat_id, channel_id, post_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_time ON user_contacts(last_contacted_at);

-- Дефолтные настройки
INSERT INTO bot_settings (setting_key, setting_value, description) VALUES
    ('greeting_template', 'Привет! 👋', 'Приветствие в начале сообщения'),
    ('registration_link', 'https://example.com/register', 'Ссылка на регистрацию'),
    ('cta_template', 'Какой у вас запрос на курс?', 'Call to Action вопрос'),
    ('contact_cooldown_hours', '24', 'Период в часах, через который можно писать повторно')
ON CONFLICT (setting_key) DO NOTHING;
