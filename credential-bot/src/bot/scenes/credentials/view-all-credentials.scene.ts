import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { CredentialsService } from '../../../credentials/credentials.service';
import { credentialsMenuKeyboard } from '../../keyboards/credentials.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('view-all-credentials')
export class ViewAllCredentialsScene {
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
    const credentials = await this.credentialsService.findAllByUser(user!.id);

    if (!credentials.length) {
      await ctx.reply('You have no credentials.', credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const list = credentials.map((c, i) => {
      const title = c.title ? `${c.title} — ` : '';
      return `${i + 1}. ${title}${c.login} : ${c.password}`;
    }).join('\n');

    const sent = await ctx.reply(
      `Your credentials:\n\n${list}`,
      Markup.inlineKeyboard([[Markup.button.callback('Back', 'view_all_cred_back')]]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action('view_all_cred_back')
  async onBack(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply('Credentials menu:', credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    await ctx.reply('Please use the button above.');
  }
}
