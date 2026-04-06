import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { CallbackAction } from '../../constants/actions.enum';

@Wizard(SceneName.RESET_PASSWORD)
export class ResetPasswordScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @WizardStep(1)
  async stepConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const sent = await ctx.reply(
      '⚠️ This will delete your account and all data (groups, credentials). Are you sure?',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes, delete everything 🗑️', CallbackAction.RESET_CONFIRM),
        Markup.button.callback('Cancel ↩️', CallbackAction.RESET_CANCEL),
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
    await ctx.reply('↩️ Reset cancelled.');
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
      await this.usersService.delete(user.id);
    }

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await botCtx.scene.enter(SceneName.SETUP_PASSWORD);
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    await ctx.reply('Please use the buttons above.');
  }
}
