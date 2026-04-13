import { Ctx, Wizard, WizardStep, Message, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { ConfigService } from '@nestjs/config';
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

@Wizard(SceneName.EDIT_GROUP)
export class EditGroupScene {
  private readonly maxLengthGroup: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly messageCleaner: MessageCleaner,
    configService: ConfigService,
  ) {
    this.maxLengthGroup = configService.get<number>('groups.maxLengthGroup')!;
  }

  @Command(BotCommand.CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, groupsMenuKeyboard());
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
      await ctx.reply(GROUPS.NO_GROUPS, groupsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const buttons = groups
      .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
      .map((g) =>
        [Markup.button.callback(g.name, `${ActionPrefix.EDIT_GROUP}${g.id}`)]
      );
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.EDIT_GROUP_CANCEL)]);

    const sent = await ctx.reply(GROUPS.SELECT_TO_EDIT, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(/^edit_group_cancel$/)
  async onCancelAction(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(/^edit_group_(?!cancel$)/)
  async onGroupSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace(ActionPrefix.EDIT_GROUP, '');
    botCtx.wizard.state.groupId = groupId;

    const sent = await ctx.reply(GROUPS.ENTER_NEW_NAME);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepWaitForSelection(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(COMMON.SELECT_GROUP_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @WizardStep(3)
  async stepSaveName(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply(COMMON.ENTER_TEXT_NAME);
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    if (text.length > this.maxLengthGroup) {
      const sent = await ctx.reply(
        GROUPS.NAME_TOO_LONG(this.maxLengthGroup),
      );
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groupId = botCtx.wizard.state.groupId!;
    await this.groupsService.update(groupId, user!.id, text);

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(GROUPS.RENAMED(text), groupsMenuKeyboard());
    await botCtx.scene.leave();
  }
}
