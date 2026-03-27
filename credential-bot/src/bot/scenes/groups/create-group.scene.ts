import { Ctx, Wizard, WizardStep, Message, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('create-group')
export class CreateGroupScene {
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
  async stepEnterName(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];
    const sent = await ctx.reply('Enter group name:\n\nSend /cancel to abort.');
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepSaveGroup(@Ctx() ctx: Context, @Message('text') text: string) {
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
    await this.groupsService.create(user!.id, text);

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(`Group "${text}" created!`, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }
}
