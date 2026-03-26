import { Update, Start, Ctx, Use } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ActivityMiddleware } from './middlewares/activity.middleware';

@Update()
export class BotUpdate {
  constructor(private readonly activityMiddleware: ActivityMiddleware) {}

  @Use()
  async onUse(@Ctx() ctx: Context, next: () => Promise<void>) {
    await this.activityMiddleware.update(ctx, next);
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(`Hello, ${ctx.from?.first_name}! Welcome to Credential Bot.`);
  }
}
