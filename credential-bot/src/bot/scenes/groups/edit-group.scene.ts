import { Ctx, Wizard, WizardStep, Message, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('edit-group')
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
      [Markup.button.callback(g.name, `edit_group_${g.id}`)]
    );
    buttons.push([Markup.button.callback('Cancel', 'edit_group_cancel')]);

    const sent = await ctx.reply('Select group to edit:', Markup.inlineKeyboard(buttons));
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
    await ctx.reply('Cancelled.', groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(/^edit_group_(?!cancel$)/)
  async onGroupSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace('edit_group_', '');
    botCtx.wizard.state.groupId = groupId;

    const sent = await ctx.reply('Enter new group name:');
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

  @WizardStep(3)
  async stepSaveName(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply('Please enter a text name:');
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    if (text.length > this.maxLengthGroup) {
      const sent = await ctx.reply(
        `Name is too long (max ${this.maxLengthGroup} characters). Try again:`,
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

    await ctx.reply(`Group renamed to "${text}"!`, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }
}
