import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('view-groups')
export class ViewGroupsScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
  ) {}

  @WizardStep(1)
  async stepShowGroups(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    if (!groups.length) {
      await ctx.reply('You have no groups.', groupsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const list = groups.map((g, i) => `${i + 1}. ${g.name}`).join('\n');
    await ctx.reply(
      `Your groups:\n\n${list}`,
      Markup.inlineKeyboard([[Markup.button.callback('Back', 'view_groups_back')]]),
    );
    botCtx.wizard.next();
  }

  @Action('view_groups_back')
  async onBack(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await ctx.reply('Groups menu:', groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(2)
  async stepWait(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await ctx.reply('Please use the button above.');
  }
}
