import type { MiddlewareFn } from 'telegraf';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';

export const trackMessageIdMiddleware: MiddlewareFn<BotContext> = async (
  ctx,
  next,
) => {
  const messageId = ctx.message?.message_id;
  if (messageId && ctx.session) {
    if (!ctx.session.messageIds) {
      ctx.session.messageIds = [];
    }
    ctx.session.messageIds.push(messageId);
  }
  await next();
};
