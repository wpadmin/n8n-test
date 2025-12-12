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

// Инициализация при старте
let isInitialized = false;

async function initializeTelegram() {
  try {
    await telegramService.initialize();
    isInitialized = true;
    console.log('Telegram service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Telegram service:', error);
    throw error;
  }
}

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', initialized: isInitialized };
});

// Проверка статуса подключения
fastify.get('/status', async (request, reply) => {
  try {
    const connected = await telegramService.isConnected();
    return {
      connected,
      initialized: isInitialized,
    };
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
});

// Получить список диалогов
fastify.get<{
  Querystring: { limit?: string };
}>('/dialogs', async (request, reply) => {
  try {
    const limit = request.query.limit ? parseInt(request.query.limit) : 100;
    const dialogs = await telegramService.getDialogs(limit);
    return { dialogs };
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
});

// Получить участников чата
fastify.get<{
  Params: { chatId: string };
  Querystring: { limit?: string };
}>('/chat/:chatId/members', async (request, reply) => {
  try {
    const { chatId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit) : 100;
    const members = await telegramService.getChatMembers(chatId, limit);
    return { members };
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
});

// Получить сообщения из чата
fastify.get<{
  Params: { chatId: string };
  Querystring: { limit?: string };
}>('/chat/:chatId/messages', async (request, reply) => {
  try {
    const { chatId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit) : 100;
    const messages = await telegramService.getMessages(chatId, limit);
    return { messages };
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
});

// Получить последние посты канала с комментариями
fastify.get<{
  Params: { channelId: string };
  Querystring: { limit?: string };
}>('/channel/:channelId/posts', async (request, reply) => {
  try {
    const { channelId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit) : 20;

    const posts = await telegramService.getChannelPostsWithComments(channelId, limit);
    return {
      channelId,
      count: posts.length,
      posts
    };
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
});

// Получить комментарии к посту в канале
fastify.get<{
  Params: { channelId: string; postId: string };
  Querystring: { limit?: string };
}>('/channel/:channelId/post/:postId/comments', async (request, reply) => {
  try {
    const { channelId, postId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit) : 100;

    const postIdNum = parseInt(postId);
    if (isNaN(postIdNum)) {
      reply.code(400).send({ error: 'postId must be a number' });
      return;
    }

    const comments = await telegramService.getPostComments(channelId, postIdNum, limit);
    return {
      channelId,
      postId: postIdNum,
      count: comments.length,
      comments
    };
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
});

// Отправить сообщение
fastify.post<{
  Body: { userId: string; message: string };
}>('/send', async (request, reply) => {
  try {
    const { userId, message } = request.body;

    if (!userId || !message) {
      reply.code(400).send({ error: 'userId and message are required' });
      return;
    }

    const result = await telegramService.sendMessage(userId, message);
    return result;
  } catch (error: any) {
    reply.code(500).send({ error: error.message });
  }
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
    // Инициализируем Telegram клиент
    await initializeTelegram();

    // Запускаем HTTP сервер
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
