import { Ctx, Wizard, WizardStep, Message, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { GroupsService } from '@/groups/groups.service';
import { MessageCleaner } from '@/bot/helpers/message-cleaner';
import { groupsMenuKeyboard } from '@/bot/keyboards/groups.keyboard';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';
import { SceneName } from '@/bot/constants/scenes.enum';
import { EBotCommand } from '@/bot/constants/commands.enum';
import { GROUPS } from '@/bot/messages/groups.messages';
import { COMMON } from '@/bot/messages/common.messages';

@Wizard(SceneName.CREATE_GROUP)
export class CreateGroupScene {
  private readonly logger = new Logger(CreateGroupScene.name);
  private readonly maxLengthGroup: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly messageCleaner: MessageCleaner,
    configService: ConfigService,
  ) {
    this.maxLengthGroup = configService.get<number>('groups.maxLengthGroup')!;
  }

  @Command(EBotCommand.CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, groupsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Command(EBotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_CANCEL_FIRST);
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
    const group = await this.groupsService.create(user!.id, text);
    this.logger.log(
      `Group created: groupId=${group.id}, userId=${user!.id}, name="${text}"`,
    );

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(GROUPS.CREATED(text), groupsMenuKeyboard());
    await botCtx.scene.leave();
  }
}
