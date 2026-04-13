import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { CredentialsService } from '../../../credentials/credentials.service';
import { credentialsMenuKeyboard } from '../../keyboards/credentials.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { CallbackAction, ActionPrefix } from '../../constants/actions.enum';
import { CREDENTIALS, formatCredentialLine } from '../../messages/credentials.messages';
import { GROUPS } from '../../messages/groups.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';

@Wizard(SceneName.VIEW_BY_GROUP)
export class ViewByGroupScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly credentialsService: CredentialsService,
  ) {}

  @WizardStep(1)
  async stepSelectGroup(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    if (!groups.length) {
      await ctx.reply(GROUPS.NO_GROUPS, credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const buttons = groups
      .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
      .map((g) =>
        [Markup.button.callback(g.name, `${ActionPrefix.VBG}${g.id}`)]
      );
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.VBG_CANCEL)]);

    const sent = await ctx.reply(CREDENTIALS.SELECT_GROUP, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.VBG_CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply(CREDENTIALS.MENU, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(/^vbg_(?!cancel$)/)
  async onGroupSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace(ActionPrefix.VBG, '');

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentials = await this.credentialsService.findByGroup(user!.id, groupId);

    if (!credentials.length) {
      await ctx.reply(CREDENTIALS.NO_CREDENTIALS_IN_GROUP, credentialsMenuKeyboard());
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

    await ctx.reply(
      CREDENTIALS.LIST_BY_GROUP(list),
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([[Markup.button.callback(KEYBOARDS.BACK, CallbackAction.VBG_BACK)]]),
      },
    );
    botCtx.wizard.next();
  }

  @Action(CallbackAction.VBG_BACK)
  async onBack(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply(CREDENTIALS.MENU, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(2)
  async stepWaitForSelection(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.SELECT_GROUP_FROM_BUTTONS);
  }

  @WizardStep(3)
  async stepWaitForBack(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_BUTTON_ABOVE);
  }
}
