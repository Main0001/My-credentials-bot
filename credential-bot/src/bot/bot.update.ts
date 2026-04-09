import { Update, Start, Ctx, Hears, Action, InjectBot } from 'nestjs-telegraf';
import { OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import type { BotContext } from './interfaces/bot-context.interface';
import { AuthGuard } from './guards/auth.guard';
import { mainKeyboard } from './keyboards/main.keyboard';
import { groupsMenuKeyboard } from './keyboards/groups.keyboard';
import { credentialsMenuKeyboard } from './keyboards/credentials.keyboard';
import { SceneName } from './constants/scenes.enum';
import { CallbackAction } from './constants/actions.enum';
import { BOT_COMMANDS } from './constants/bot-commands.config';
import { BOT_DESCRIPTION, BOT_SHORT_DESCRIPTION } from './constants/bot-description.config';
import { AUTH } from './messages/auth.messages';
import { GROUPS } from './messages/groups.messages';
import { CREDENTIALS } from './messages/credentials.messages';
import { KEYBOARDS } from './messages/keyboards.messages';

@Update()
export class BotUpdate implements OnModuleInit {
  constructor(
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly authGuard: AuthGuard,
  ) {}

  async onModuleInit() {
    await this.bot.telegram.setMyCommands(BOT_COMMANDS);
    await this.bot.telegram.setMyDescription(BOT_DESCRIPTION);
    await this.bot.telegram.setMyShortDescription(BOT_SHORT_DESCRIPTION);
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    await ctx.reply(
      AUTH.WELCOME(ctx.from?.first_name ?? ''),
      mainKeyboard(),
    );
  }

  @Hears(KEYBOARDS.GROUPS)
  async onGroups(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(GROUPS.MENU, groupsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Hears(KEYBOARDS.CREDENTIALS)
  async onCredentials(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(CREDENTIALS.MENU, credentialsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Hears(KEYBOARDS.RESET_PASSWORD)
  async onResetPassword(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    await ctx.scene.enter(SceneName.RESET_PASSWORD);
  }

  @Action(CallbackAction.BACK_TO_MAIN)
  async onBackToMain(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.reply(KEYBOARDS.CHOOSE_OPTION, mainKeyboard());
  }

  @Action(CallbackAction.GROUP_CREATE)
  async onGroupCreate(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.CREATE_GROUP);
  }

  @Action(CallbackAction.GROUP_VIEW)
  async onGroupView(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.VIEW_GROUPS);
  }

  @Action(CallbackAction.GROUP_EDIT)
  async onGroupEdit(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.EDIT_GROUP);
  }

  @Action(CallbackAction.GROUP_DELETE)
  async onGroupDelete(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.DELETE_GROUP);
  }

  @Action(CallbackAction.CREDENTIAL_ADD)
  async onCredentialAdd(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.ADD_CREDENTIAL);
  }

  @Action(CallbackAction.CREDENTIAL_VIEW_ALL)
  async onCredentialViewAll(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.VIEW_ALL_CREDENTIALS);
  }

  @Action(CallbackAction.CREDENTIAL_VIEW_BY_GROUP)
  async onCredentialViewByGroup(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.VIEW_BY_GROUP);
  }

  @Action(CallbackAction.CREDENTIAL_VIEW_NO_GROUP)
  async onCredentialViewNoGroup(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.VIEW_WITHOUT_GROUP);
  }

  @Action(CallbackAction.CREDENTIAL_EDIT)
  async onCredentialEdit(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.EDIT_CREDENTIAL);
  }

  @Action(CallbackAction.CREDENTIAL_DELETE)
  async onCredentialDelete(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter(SceneName.DELETE_CREDENTIAL);
  }
}
