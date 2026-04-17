import { Ctx, Wizard, WizardStep, Action, Command } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { BotCommand } from '../../constants/commands.enum';
import { CallbackAction } from '../../constants/actions.enum';
import { AUTH } from '../../messages/auth.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';
import { mainKeyboard } from '../../keyboards/main.keyboard';

@Wizard(SceneName.LOGOUT)
export class LogoutScene {
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
      AUTH.LOGOUT_CONFIRM_PROMPT,
      Markup.inlineKeyboard([
        Markup.button.callback(
          KEYBOARDS.YES_LOGOUT,
          CallbackAction.LOGOUT_CONFIRM,
        ),
        Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.LOGOUT_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.LOGOUT_CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply(AUTH.LOGOUT_CANCELLED);
    await botCtx.scene.leave();
  }

  @Action(CallbackAction.LOGOUT_CONFIRM)
  async onConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);

    if (user) {
      await this.usersService.clearLastActivity(user.id);
    }

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(AUTH.LOGOUT_SUCCESS);
    await botCtx.scene.enter(SceneName.ENTER_PASSWORD);
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    const sent = await ctx.reply(
      AUTH.LOGOUT_CONFIRM_PROMPT,
      Markup.inlineKeyboard([
        Markup.button.callback(
          KEYBOARDS.YES_LOGOUT,
          CallbackAction.LOGOUT_CONFIRM,
        ),
        Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.LOGOUT_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
  }
}
