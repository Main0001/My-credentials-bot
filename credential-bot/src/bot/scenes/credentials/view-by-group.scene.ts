import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { CredentialsService } from '../../../credentials/credentials.service';
import { credentialsMenuKeyboard } from '../../keyboards/credentials.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { CallbackAction, ActionPrefix } from '../../constants/actions.enum';

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
      await ctx.reply('ℹ️ You have no groups.', credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const buttons = groups.map((g) =>
      [Markup.button.callback(g.name, `${ActionPrefix.VBG}${g.id}`)]
    );
    buttons.push([Markup.button.callback('Cancel ↩️', CallbackAction.VBG_CANCEL)]);

    const sent = await ctx.reply('📁 Select group:', Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.VBG_CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply('Credentials menu 🔑:', credentialsMenuKeyboard());
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
      await ctx.reply('ℹ️ No credentials in this group.', credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const list = credentials.map((c, i) => {
      const title = c.title ? `${c.title} — ` : '';
      return `${i + 1}. ${title}${c.login} : ${c.password}`;
    }).join('\n');

    await ctx.reply(
      `🔑 Credentials in group:\n\n${list}`,
      Markup.inlineKeyboard([[Markup.button.callback('Back ↩️', CallbackAction.VBG_BACK)]]),
    );
    botCtx.wizard.next();
  }

  @Action(CallbackAction.VBG_BACK)
  async onBack(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply('Credentials menu 🔑:', credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(2)
  async stepWaitForSelection(@Ctx() ctx: Context) {
    await ctx.reply('Please select a group from the buttons above.');
  }

  @WizardStep(3)
  async stepWaitForBack(@Ctx() ctx: Context) {
    await ctx.reply('Please use the button above.');
  }
}
