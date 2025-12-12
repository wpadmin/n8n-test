import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const SESSION_DIR = path.join(__dirname, '../sessions');

// Создаём папку для сессий если её нет
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Функция для ввода с консоли
function input(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export class TelegramService {
  private client: TelegramClient | null = null;
  private apiId: number;
  private apiHash: string;
  private phoneNumber: string;
  private sessionFile: string;

  constructor(apiId: string, apiHash: string, phoneNumber: string) {
    this.apiId = parseInt(apiId);
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.sessionFile = path.join(SESSION_DIR, `${phoneNumber}.session`);
  }

  /**
   * Загрузить сохранённую сессию из файла
   */
  private loadSession(): string {
    try {
      if (fs.existsSync(this.sessionFile)) {
        return fs.readFileSync(this.sessionFile, 'utf-8');
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    return '';
  }

  /**
   * Сохранить сессию в файл
   */
  private saveSession(sessionString: string): void {
    try {
      fs.writeFileSync(this.sessionFile, sessionString);
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Инициализация клиента
   */
  async initialize(): Promise<void> {
    const sessionString = this.loadSession();
    const stringSession = new StringSession(sessionString);

    this.client = new TelegramClient(stringSession, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });

    console.log('Connecting to Telegram...');
    await this.client.start({
      phoneNumber: async () => this.phoneNumber,
      password: async () => await input('Please enter your password: '),
      phoneCode: async () => await input('Please enter the code you received: '),
      onError: (err: any) => console.log(err),
    });

    console.log('Successfully connected to Telegram!');

    // Сохраняем сессию
    const session = this.client.session.save() as unknown as string;
    this.saveSession(session);
  }

  /**
   * Проверить статус подключения
   */
  async isConnected(): Promise<boolean> {
    return this.client?.connected ?? false;
  }

  /**
   * Получить список диалогов (чатов)
   */
  async getDialogs(limit: number = 100) {
    if (!this.client) throw new Error('Client not initialized');

    const dialogs = await this.client.getDialogs({ limit });

    return dialogs.map(dialog => ({
      id: dialog.id?.toString(),
      title: dialog.title || dialog.name,
      isGroup: dialog.isGroup,
      isChannel: dialog.isChannel,
      isUser: dialog.isUser,
    }));
  }

  /**
   * Получить участников чата
   */
  async getChatMembers(chatId: string, limit: number = 100) {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const participants = await this.client.getParticipants(chatId, { limit });

      return participants.map(user => ({
        id: user.id?.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bot: user.bot,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get chat members: ${error.message}`);
    }
  }

  /**
   * Отправить сообщение
   */
  async sendMessage(userId: string, message: string) {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const result = await this.client.sendMessage(userId, { message });

      return {
        success: true,
        messageId: result.id,
        date: result.date,
      };
    } catch (error: any) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Получить сообщения из чата
   */
  async getMessages(chatId: string, limit: number = 100) {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const messages = await this.client.getMessages(chatId, { limit });

      return messages.map(msg => ({
        id: msg.id,
        message: msg.message,
        senderId: msg.senderId?.toString(),
        date: msg.date,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  /**
   * Получить последние посты канала с включенными комментариями
   */
  async getChannelPostsWithComments(channelId: string, limit: number = 20) {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const { Api } = require('telegram');
      const messages = await this.client.getMessages(channelId, { limit });

      // Фильтруем только посты с включенными комментариями
      const postsWithComments = messages
        .filter((msg: any) => msg.replies && msg.replies.replies > 0)
        .map((msg: any) => ({
          id: msg.id,
          message: msg.message,
          date: msg.date,
          commentsCount: msg.replies?.replies || 0,
        }));

      return postsWithComments;
    } catch (error: any) {
      throw new Error(`Failed to get channel posts: ${error.message}`);
    }
  }

  /**
   * Получить комментарии к посту в канале
   */
  async getPostComments(channelId: string, postId: number, limit: number = 100) {
    if (!this.client) throw new Error('Client not initialized');

    try {
      const { Api } = require('telegram');

      const result = await this.client.invoke(
        new Api.messages.GetReplies({
          peer: channelId,
          msgId: postId,
          offsetId: 0,
          offsetDate: 0,
          addOffset: 0,
          limit: limit,
          maxId: 0,
          minId: 0,
          hash: BigInt(0),
        })
      );

      if (!result.messages) {
        return [];
      }

      return result.messages.map((msg: any) => ({
        id: msg.id,
        message: msg.message,
        senderId: msg.fromId?.userId?.toString() || msg.peerId?.userId?.toString(),
        date: msg.date,
        senderUsername: msg.from?.username,
        senderFirstName: msg.from?.firstName,
      }));
    } catch (error: any) {
      throw new Error(`Failed to get post comments: ${error.message}`);
    }
  }

  /**
   * Отключиться
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}
