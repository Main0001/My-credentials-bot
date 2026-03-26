import { UseGuards } from '@nestjs/common';
import { Update, Start, Ctx, Use, Hears, Action } from 'nestjs-telegraf';
import type { BotContext } from './interfaces/bot-context.interface';
import { ActivityMiddleware } from './middlewares/activity.middleware';
import { AuthGuard } from './guards/auth.guard';
import { mainKeyboard } from './keyboards/main.keyboard';
import { groupsMenuKeyboard } from './keyboards/groups.keyboard';
import { credentialsMenuKeyboard } from './keyboards/credentials.keyboard';

@Update()
export class BotUpdate {
  constructor(private readonly activityMiddleware: ActivityMiddleware) {}

  @Use()
  async onUse(@Ctx() ctx: BotContext, next: () => Promise<void>) {
    await this.activityMiddleware.update(ctx, next);
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    await ctx.reply(
      `Hello, ${ctx.from?.first_name}! Welcome to Credential Bot.`,
      mainKeyboard(),
    );
  }

  @Hears('Groups')
  @UseGuards(AuthGuard)
  async onGroups(@Ctx() ctx: BotContext) {
    await ctx.reply('Groups menu:', groupsMenuKeyboard());
  }

  @Hears('Credentials')
  @UseGuards(AuthGuard)
  async onCredentials(@Ctx() ctx: BotContext) {
    await ctx.reply('Credentials menu:', credentialsMenuKeyboard());
  }

  @Hears('Reset password')
  @UseGuards(AuthGuard)
  async onResetPassword(@Ctx() ctx: BotContext) {
    await ctx.scene.enter('reset-password');
  }

  @Action('back_to_main')
  @UseGuards(AuthGuard)
  async onBackToMain(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Main menu:');
    await ctx.reply('Choose an option:', mainKeyboard());
  }
}
