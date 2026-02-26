import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { TelegramService } from './telegram';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Включаем CORS для n8n
fastify.register(cors, {
  origin: true,
});

// Инициализируем Telegram клиент
const telegramService = new TelegramService(
  process.env.TELEGRAM_API_ID!,
  process.env.TELEGRAM_API_HASH!,
  process.env.TELEGRAM_PHONE!
);

async function initializeTelegram() {
  try {
    await telegramService.initialize();
    console.log('Telegram service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Telegram service:', error);
    throw error;
  }
}

// Хелпер для парсинга limit из query
function parseLimit(raw: string | undefined, defaultVal: number, max: number): number {
  return Math.min(Math.max(parseInt(raw ?? '') || defaultVal, 1), max);
}

// Глобальный обработчик ошибок
fastify.setErrorHandler((error: { statusCode?: number; message: string }, request: any, reply: any) => {
  request.log.error(error);
  reply.code(error.statusCode ?? 500).send({
    error: error.message,
  });
});

// Health check
fastify.get('/health', async () => {
  const connected = await telegramService.isConnected();
  return { status: 'ok', connected };
});

// Проверка статуса подключения
fastify.get('/status', async () => {
  const connected = await telegramService.isConnected();
  return { connected };
});

// Получить список диалогов
fastify.get<{
  Querystring: { limit?: string };
}>('/dialogs', async (request) => {
  const limit = parseLimit(request.query.limit, 100, 500);
  const dialogs = await telegramService.getDialogs(limit);
  return { dialogs };
});

// Получить участников чата
fastify.get<{
  Params: { chatId: string };
  Querystring: { limit?: string };
}>('/chat/:chatId/members', async (request) => {
  const { chatId } = request.params;
  const limit = parseLimit(request.query.limit, 100, 500);
  const members = await telegramService.getChatMembers(chatId, limit);
  return { members };
});

// Получить сообщения из чата
fastify.get<{
  Params: { chatId: string };
  Querystring: { limit?: string };
}>('/chat/:chatId/messages', async (request) => {
  const { chatId } = request.params;
  const limit = parseLimit(request.query.limit, 100, 500);
  const messages = await telegramService.getMessages(chatId, limit);
  return { messages };
});

// Получить последние посты канала с комментариями
fastify.get<{
  Params: { channelId: string };
  Querystring: { limit?: string };
}>('/channel/:channelId/posts', async (request) => {
  const { channelId } = request.params;
  const limit = parseLimit(request.query.limit, 20, 100);
  const posts = await telegramService.getChannelPostsWithComments(channelId, limit);
  return { channelId, count: posts.length, posts };
});

// Получить комментарии к посту в канале
fastify.get<{
  Params: { channelId: string; postId: string };
  Querystring: { limit?: string };
}>('/channel/:channelId/post/:postId/comments', async (request, reply) => {
  const { channelId, postId } = request.params;
  const limit = parseLimit(request.query.limit, 100, 500);

  const postIdNum = parseInt(postId);
  if (isNaN(postIdNum)) {
    return reply.code(400).send({ error: 'postId must be a number' });
  }

  const comments = await telegramService.getPostComments(channelId, postIdNum, limit);
  return { channelId, postId: postIdNum, count: comments.length, comments };
});

// Отправить сообщение
fastify.post<{
  Body: { userId: string; message: string };
}>('/send', async (request, reply) => {
  const { userId, message } = request.body;

  if (!userId || !message) {
    return reply.code(400).send({ error: 'userId and message are required' });
  }

  const result = await telegramService.sendMessage(userId, message);
  return result;
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await telegramService.disconnect();
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await telegramService.disconnect();
  await fastify.close();
  process.exit(0);
});

// Запуск сервера
const start = async () => {
  try {
    await initializeTelegram();

    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
