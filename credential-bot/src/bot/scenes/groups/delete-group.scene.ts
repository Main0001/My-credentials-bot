import { Ctx, Wizard, WizardStep, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { BotCommand } from '../../constants/commands.enum';
import { CallbackAction, ActionPrefix } from '../../constants/actions.enum';
import { GROUPS } from '../../messages/groups.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';

@Wizard(SceneName.DELETE_GROUP)
export class DeleteGroupScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @Command(BotCommand.CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Command(BotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_CANCEL_FIRST);
  }

  @WizardStep(1)
  async stepSelectGroup(@Ctx() ctx: Context) {
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

    const buttons = groups
      .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
      .map((g) =>
        [Markup.button.callback(g.name, `${ActionPrefix.DEL_GROUP}${g.id}`)]
      );
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.DEL_GROUP_CANCEL)]);

    const sent = await ctx.reply(GROUPS.SELECT_TO_DELETE, Markup.inlineKeyboard(buttons));
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
    await ctx.reply(COMMON.CANCELLED, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(/^del_group_(?!cancel$|confirm$)/)
  async onGroupSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace(ActionPrefix.DEL_GROUP, '');
    botCtx.wizard.state.groupId = groupId;

    const sent = await ctx.reply(
      GROUPS.DELETE_CONFIRM,
      Markup.inlineKeyboard([
        Markup.button.callback(KEYBOARDS.YES_DELETE, CallbackAction.DEL_GROUP_CONFIRM),
        Markup.button.callback(KEYBOARDS.NO, CallbackAction.DEL_GROUP_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepWaitForSelection(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    const sent = await ctx.reply(COMMON.SELECT_GROUP_FROM_BUTTONS);
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

    await ctx.reply(GROUPS.DELETED, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(3)
  async stepWaitForConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    const sent = await ctx.reply(
      GROUPS.DELETE_CONFIRM,
      Markup.inlineKeyboard([
        Markup.button.callback(KEYBOARDS.YES_DELETE, CallbackAction.DEL_GROUP_CONFIRM),
        Markup.button.callback(KEYBOARDS.NO, CallbackAction.DEL_GROUP_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
  }
}
