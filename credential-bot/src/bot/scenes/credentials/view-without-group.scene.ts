import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { CredentialsService } from '../../../credentials/credentials.service';
import { credentialsMenuKeyboard } from '../../keyboards/credentials.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { CallbackAction } from '../../constants/actions.enum';
import { CREDENTIALS } from '../../messages/credentials.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';

@Wizard(SceneName.VIEW_WITHOUT_GROUP)
export class ViewWithoutGroupScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly credentialsService: CredentialsService,
  ) {}

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

    const list = credentials.map((c, i) => {
      const title = c.title ? `${c.title} — ` : '';
      return `${i + 1}. ${title}${c.login} : ${c.password}`;
    }).join('\n');

    const sent = await ctx.reply(
      CREDENTIALS.LIST_WITHOUT_GROUP(list),
      Markup.inlineKeyboard([[Markup.button.callback(KEYBOARDS.BACK, CallbackAction.VWG_BACK)]]),
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
