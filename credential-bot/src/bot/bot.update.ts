import { Update, Start, Ctx, Action, Command, InjectBot } from 'nestjs-telegraf';
import { OnModuleInit, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import type { BotContext } from './interfaces/bot-context.interface';
import { AuthGuard } from './guards/auth.guard';
import { MessageCleaner } from './helpers/message-cleaner';
import { mainKeyboard } from './keyboards/main.keyboard';
import { groupsMenuKeyboard } from './keyboards/groups.keyboard';
import { credentialsMenuKeyboard } from './keyboards/credentials.keyboard';
import { SceneName } from './constants/scenes.enum';
import { BotCommand } from './constants/commands.enum';
import { CallbackAction } from './constants/actions.enum';
import { BOT_COMMANDS } from './constants/bot-commands.config';
import { BOT_DESCRIPTION, BOT_SHORT_DESCRIPTION } from './constants/bot-description.config';
import { AUTH } from './messages/auth.messages';
import { GROUPS } from './messages/groups.messages';
import { CREDENTIALS } from './messages/credentials.messages';
import { COMMON } from './messages/common.messages';
import { KEYBOARDS } from './messages/keyboards.messages';

@Update()
export class BotUpdate implements OnModuleInit {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly authGuard: AuthGuard,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands(BOT_COMMANDS);
    await this.bot.telegram.setMyDescription(BOT_DESCRIPTION);
    await this.bot.telegram.setMyShortDescription(BOT_SHORT_DESCRIPTION);
  }

  private async enterScene(ctx: BotContext, sceneName: SceneName) {
    this.logger.log(
      `Scene entry: ${sceneName}, telegramId=${ctx.from?.id}`,
    );
    await ctx.scene.enter(sceneName);
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    this.logger.log(`Bot started: telegramId=${ctx.from?.id}`);
    await this.messageCleaner.deleteMenuMessage(ctx);
    const sent = await ctx.reply(
      AUTH.WELCOME(ctx.from?.first_name ?? ''),
      mainKeyboard(),
    );
    ctx.session.menuMessageId = sent.message_id;
  }

  @Command(BotCommand.MENU)
  async onMenu(@Ctx() ctx: BotContext) {
    if (ctx.scene.current) {
      await ctx.reply(COMMON.USE_CANCEL_FIRST);
      return;
    }

    await this.messageCleaner.deleteMenuMessage(ctx);

    if (!(await this.authGuard.validate(ctx))) return;

    const sent = await ctx.reply(KEYBOARDS.CHOOSE_OPTION, mainKeyboard());
    ctx.session.menuMessageId = sent.message_id;
  }

  @Action(CallbackAction.MAIN_GROUPS)
  async onGroups(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.session.menuMessageId = undefined;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    const sent = await ctx.reply(GROUPS.MENU, groupsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Action(CallbackAction.MAIN_CREDENTIALS)
  async onCredentials(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.session.menuMessageId = undefined;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    const sent = await ctx.reply(CREDENTIALS.MENU, credentialsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Action(CallbackAction.MAIN_RESET_PASSWORD)
  async onResetPassword(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.session.menuMessageId = undefined;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    await this.enterScene(ctx, SceneName.RESET_PASSWORD);
  }

  @Action(CallbackAction.MAIN_LOGOUT)
  async onLogout(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    ctx.session.menuMessageId = undefined;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    await this.enterScene(ctx, SceneName.LOGOUT);
  }

  @Action(CallbackAction.BACK_TO_MAIN)
  async onBackToMain(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    const sent = await ctx.reply(KEYBOARDS.CHOOSE_OPTION, mainKeyboard());
    ctx.session.menuMessageId = sent.message_id;
  }

  @Action(CallbackAction.GROUP_CREATE)
  async onGroupCreate(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.CREATE_GROUP);
  }

  @Action(CallbackAction.GROUP_VIEW)
  async onGroupView(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.VIEW_GROUPS);
  }

  @Action(CallbackAction.GROUP_EDIT)
  async onGroupEdit(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.EDIT_GROUP);
  }

  @Action(CallbackAction.GROUP_DELETE)
  async onGroupDelete(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.DELETE_GROUP);
  }

  @Action(CallbackAction.CREDENTIAL_ADD)
  async onCredentialAdd(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.ADD_CREDENTIAL);
  }

  @Action(CallbackAction.CREDENTIAL_VIEW_ALL)
  async onCredentialViewAll(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.VIEW_ALL_CREDENTIALS);
  }

  @Action(CallbackAction.CREDENTIAL_VIEW_BY_GROUP)
  async onCredentialViewByGroup(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.VIEW_BY_GROUP);
  }

  @Action(CallbackAction.CREDENTIAL_VIEW_NO_GROUP)
  async onCredentialViewNoGroup(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.VIEW_WITHOUT_GROUP);
  }

  @Action(CallbackAction.CREDENTIAL_EDIT)
  async onCredentialEdit(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.EDIT_CREDENTIAL);
  }

  @Action(CallbackAction.CREDENTIAL_DELETE)
  async onCredentialDelete(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await this.enterScene(ctx, SceneName.DELETE_CREDENTIAL);
  }
}
