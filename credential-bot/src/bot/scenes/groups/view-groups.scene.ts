import { Ctx, Wizard, WizardStep, Action, Command } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { BotCommand } from '../../constants/commands.enum';
import { CallbackAction } from '../../constants/actions.enum';
import { GROUPS } from '../../messages/groups.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';

@Wizard(SceneName.VIEW_GROUPS)
export class ViewGroupsScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @Command(BotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_CANCEL_FIRST);
  }

  @WizardStep(1)
  async stepShowGroups(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    if (!groups.length) {
      await ctx.reply(GROUPS.NO_GROUPS, groupsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const list = groups
      .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
      .map((g, i) => `${i + 1}. ${g.name}`).join('\n');
    const sent = await ctx.reply(
      GROUPS.LIST(list),
      Markup.inlineKeyboard([[Markup.button.callback(KEYBOARDS.BACK, CallbackAction.VIEW_GROUPS_BACK)]]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.VIEW_GROUPS_BACK)
  async onBack(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply(GROUPS.MENU, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await ctx.reply(COMMON.USE_BUTTON_ABOVE);
  }
}
