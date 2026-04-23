import { Ctx, Wizard, WizardStep, Action, Command } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { MessageCleaner } from '@/bot/helpers/message-cleaner';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';
import { SceneName } from '@/bot/constants/scenes.enum';
import { BotCommand } from '@/bot/constants/commands.enum';
import { CallbackAction } from '@/bot/constants/actions.enum';
import { AUTH } from '@/bot/messages/auth.messages';
import { COMMON } from '@/bot/messages/common.messages';
import { KEYBOARDS } from '@/bot/messages/keyboards.messages';
import { mainKeyboard } from '@/bot/keyboards/main.keyboard';

@Wizard(SceneName.RESET_PASSWORD)
export class ResetPasswordScene {
  private readonly logger = new Logger(ResetPasswordScene.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @Command(BotCommand.CANCEL)
  async onСommandCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, mainKeyboard());
    await botCtx.scene.leave();
  }

  @Command(BotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_CANCEL_FIRST);
  }

  @WizardStep(1)
  async stepConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const sent = await ctx.reply(
      AUTH.RESET_CONFIRM_PROMPT,
      Markup.inlineKeyboard([
        Markup.button.callback(
          KEYBOARDS.YES_DELETE_EVERYTHING,
          CallbackAction.RESET_CONFIRM,
        ),
        Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.RESET_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.RESET_CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply(AUTH.RESET_CANCELLED);
    await botCtx.scene.leave();
  }

  @Action(CallbackAction.RESET_CONFIRM)
  async onConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);

    if (user) {
      this.logger.warn(
        `Account reset (all data deleted): telegramId=${telegramId}, userId=${user.id}`,
      );
      await this.usersService.delete(user.id);
    }

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await botCtx.scene.enter(SceneName.SETUP_PASSWORD);
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    const sent = await ctx.reply(
      AUTH.RESET_CONFIRM_PROMPT,
      Markup.inlineKeyboard([
        Markup.button.callback(
          KEYBOARDS.YES_DELETE_EVERYTHING,
          CallbackAction.RESET_CONFIRM,
        ),
        Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.RESET_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
  }
}
