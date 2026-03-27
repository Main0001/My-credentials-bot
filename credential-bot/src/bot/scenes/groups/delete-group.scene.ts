import { Ctx, Wizard, WizardStep, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('delete-group')
export class DeleteGroupScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @Command('cancel')
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply('Cancelled.', groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(1)
  async stepSelectGroup(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    if (!groups.length) {
      await ctx.reply('You have no groups.', groupsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const buttons = groups.map((g) =>
      [Markup.button.callback(g.name, `del_group_${g.id}`)]
    );
    buttons.push([Markup.button.callback('Cancel', 'del_group_cancel')]);

    const sent = await ctx.reply('Select group to delete:', Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(/^del_group_cancel$/)
  async onCancelAction(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply('Cancelled.', groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(/^del_group_(?!cancel$|confirm$)/)
  async onGroupSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace('del_group_', '');
    botCtx.wizard.state.groupId = groupId;

    const sent = await ctx.reply(
      'Are you sure? Credentials in this group will be ungrouped.',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes, delete', 'del_group_confirm'),
        Markup.button.callback('No', 'del_group_cancel'),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepWaitForSelection(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Please select a group from the buttons above.');
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(/^del_group_confirm$/)
  async onConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groupId = botCtx.wizard.state.groupId!;
    await this.groupsService.delete(groupId, user!.id);

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply('Group deleted!', groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(3)
  async stepWaitForConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Please use the buttons above.');
    botCtx.session.messageIds.push(sent.message_id);
  }
}
