import { Injectable, Logger } from '@nestjs/common';
import { Context } from 'telegraf';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';

@Injectable()
export class MessageCleaner {
  private readonly logger = new Logger(MessageCleaner.name);

  async deleteMessage(ctx: Context, messageId: number): Promise<void> {
    try {
      await ctx.deleteMessage(messageId);
    } catch {
      this.logger.warn(`Failed to delete message ${messageId}`);
    }
  }

  async deleteMessages(ctx: Context, messageIds: number[]): Promise<void> {
    await Promise.allSettled(
      messageIds.map((id) => this.deleteMessage(ctx, id)),
    );
  }

  async deleteMenuMessage(ctx: BotContext): Promise<void> {
    if (!ctx.session?.menuMessageId) return;
    await this.deleteMessage(ctx, ctx.session.menuMessageId);
    ctx.session.menuMessageId = undefined;
  }
}
