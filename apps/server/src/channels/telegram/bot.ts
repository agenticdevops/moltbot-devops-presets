/**
 * Telegram Bot Integration for Opsbot
 *
 * Handles message receiving, command parsing, and response sending.
 */

export interface TelegramConfig {
  token: string;
  allowedChatIds?: number[];
  webhookUrl?: string;
}

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  userId: number;
  username?: string;
  text: string;
  date: number;
}

export interface TelegramResponse {
  chatId: number;
  text: string;
  parseMode?: "Markdown" | "MarkdownV2" | "HTML";
  replyToMessageId?: number;
}

const TELEGRAM_API = "https://api.telegram.org/bot";

export class TelegramBot {
  private token: string;
  private allowedChatIds: Set<number>;
  private baseUrl: string;

  constructor(config: TelegramConfig) {
    this.token = config.token;
    this.allowedChatIds = new Set(config.allowedChatIds || []);
    this.baseUrl = `${TELEGRAM_API}${this.token}`;
  }

  /**
   * Check if a chat is allowed
   */
  isAllowed(chatId: number): boolean {
    // If no allowed list, allow all
    if (this.allowedChatIds.size === 0) {
      return true;
    }
    return this.allowedChatIds.has(chatId);
  }

  /**
   * Send a message to a chat
   */
  async sendMessage(response: TelegramResponse): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: response.chatId,
          text: response.text,
          parse_mode: response.parseMode || "Markdown",
          reply_to_message_id: response.replyToMessageId,
        }),
      });

      const data = await res.json();
      return data.ok === true;
    } catch (error) {
      console.error("[Telegram] Failed to send message:", error);
      return false;
    }
  }

  /**
   * Send a long message (split if > 4096 chars)
   */
  async sendLongMessage(chatId: number, text: string, replyTo?: number): Promise<boolean> {
    const MAX_LENGTH = 4000; // Leave some margin

    if (text.length <= MAX_LENGTH) {
      return this.sendMessage({ chatId, text, replyToMessageId: replyTo });
    }

    // Split into chunks
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= MAX_LENGTH) {
        chunks.push(remaining);
        break;
      }

      // Find a good split point (newline or space)
      let splitAt = remaining.lastIndexOf("\n", MAX_LENGTH);
      if (splitAt === -1 || splitAt < MAX_LENGTH / 2) {
        splitAt = remaining.lastIndexOf(" ", MAX_LENGTH);
      }
      if (splitAt === -1 || splitAt < MAX_LENGTH / 2) {
        splitAt = MAX_LENGTH;
      }

      chunks.push(remaining.slice(0, splitAt));
      remaining = remaining.slice(splitAt).trim();
    }

    // Send chunks
    for (let i = 0; i < chunks.length; i++) {
      const success = await this.sendMessage({
        chatId,
        text: chunks[i],
        replyToMessageId: i === 0 ? replyTo : undefined,
      });
      if (!success) return false;

      // Small delay between messages
      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }

    return true;
  }

  /**
   * Set webhook URL
   */
  async setWebhook(url: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      console.log("[Telegram] Webhook set:", data);
      return data.ok === true;
    } catch (error) {
      console.error("[Telegram] Failed to set webhook:", error);
      return false;
    }
  }

  /**
   * Delete webhook (for polling mode)
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/deleteWebhook`, {
        method: "POST",
      });

      const data = await res.json();
      return data.ok === true;
    } catch (error) {
      console.error("[Telegram] Failed to delete webhook:", error);
      return false;
    }
  }

  /**
   * Get bot info
   */
  async getMe(): Promise<{ id: number; username: string } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/getMe`);
      const data = await res.json();

      if (data.ok) {
        return {
          id: data.result.id,
          username: data.result.username,
        };
      }
      return null;
    } catch (error) {
      console.error("[Telegram] Failed to get bot info:", error);
      return null;
    }
  }

  /**
   * Parse incoming update from webhook
   */
  parseUpdate(update: any): TelegramMessage | null {
    if (!update.message || !update.message.text) {
      return null;
    }

    const msg = update.message;

    return {
      messageId: msg.message_id,
      chatId: msg.chat.id,
      userId: msg.from?.id || 0,
      username: msg.from?.username,
      text: msg.text,
      date: msg.date,
    };
  }
}
