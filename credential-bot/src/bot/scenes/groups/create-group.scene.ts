import { Ctx, Wizard, WizardStep, Message, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { groupsMenuKeyboard } from '../../keyboards/groups.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { BotCommand } from '../../constants/commands.enum';
import { GROUPS } from '../../messages/groups.messages';
import { COMMON } from '../../messages/common.messages';

@Wizard(SceneName.CREATE_GROUP)
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
  async stepEnterName(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];
    const sent = await ctx.reply(GROUPS.CREATE_PROMPT);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepSaveGroup(@Ctx() ctx: Context, @Message('text') text: string) {
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
    await this.groupsService.create(user!.id, text);

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(GROUPS.CREATED(text), groupsMenuKeyboard());
    await botCtx.scene.leave();
  }
}
