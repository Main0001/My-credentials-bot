import { Ctx, Wizard, WizardStep, Action, Command } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '@/users/users.service';
import { CredentialsService } from '@/credentials/credentials.service';
import { credentialsMenuKeyboard } from '@/bot/keyboards/credentials.keyboard';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';
import { SceneName } from '@/bot/constants/scenes.enum';
import { EBotCommand } from '@/bot/constants/commands.enum';
import { CallbackAction } from '@/bot/constants/actions.enum';
import { CREDENTIALS, formatCredentialLine } from '@/bot/messages/credentials.messages';
import { COMMON } from '@/bot/messages/common.messages';
import { KEYBOARDS } from '@/bot/messages/keyboards.messages';

@Wizard(SceneName.VIEW_WITHOUT_GROUP)
export class ViewWithoutGroupScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly credentialsService: CredentialsService,
  ) {}

  @Command(EBotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_CANCEL_FIRST);
  }

  @WizardStep(1)
  async stepShowCredentials(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentials = await this.credentialsService.findWithoutGroup(user!.id);

    if (!credentials.length) {
      await ctx.reply(CREDENTIALS.NO_CREDENTIALS_WITHOUT_GROUP, credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const list = credentials
      .sort((a, b) => {
        const labelA = a.title ?? a.login;
        const labelB = b.title ?? b.login;
        return labelA > labelB ? 1 : labelA < labelB ? -1 : 0;
      })
      .map((c, i) =>
        `${i + 1}. ${formatCredentialLine(c.title, c.login, c.password)}`,
      ).join('\n');

    const sent = await ctx.reply(
      CREDENTIALS.LIST_WITHOUT_GROUP(list),
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback(KEYBOARDS.BACK, CallbackAction.VWG_BACK)]]),
      },
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.VWG_BACK)
  async onBack(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply(CREDENTIALS.MENU, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_BUTTON_ABOVE);
  }
}
