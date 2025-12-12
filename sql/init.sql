-- Юзеры бота
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    registered_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    segment VARCHAR(50)
);

-- История сообщений
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message_text TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20),
    error TEXT
);

-- Очередь сообщений
CREATE TABLE IF NOT EXISTS message_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    error TEXT
);

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

-- Индексы
CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id);
CREATE INDEX IF NOT EXISTS idx_users_segment ON users(segment);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON message_queue(status);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_user_contacts_lookup ON user_contacts(user_chat_id, channel_id, post_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_time ON user_contacts(last_contacted_at);

-- Дефолтные настройки
INSERT INTO bot_settings (setting_key, setting_value, description) VALUES
    ('greeting_template', 'Привет! 👋', 'Приветствие в начале сообщения'),
    ('registration_link', 'https://example.com/register', 'Ссылка на регистрацию'),
    ('cta_template', 'Какой у вас запрос на курс?', 'Call to Action вопрос'),
    ('contact_cooldown_hours', '24', 'Период в часах, через который можно писать повторно')
ON CONFLICT (setting_key) DO NOTHING;