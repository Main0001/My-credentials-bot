import { Update, Start, Ctx, Hears, Action } from 'nestjs-telegraf';
import type { BotContext } from './interfaces/bot-context.interface';
import { AuthGuard } from './guards/auth.guard';
import { mainKeyboard } from './keyboards/main.keyboard';
import { groupsMenuKeyboard } from './keyboards/groups.keyboard';
import { credentialsMenuKeyboard } from './keyboards/credentials.keyboard';
import { SceneName } from './constants/scenes.enum';
import { CallbackAction } from './constants/actions.enum';

@Update()
export class BotUpdate {
  constructor(private readonly authGuard: AuthGuard) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    await ctx.reply(
      `Hello, ${ctx.from?.first_name}! Welcome to Credential Bot 👋`,
      mainKeyboard(),
    );
  }

  @Hears('Groups 📁')
  async onGroups(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Groups menu 📁:', groupsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Hears('Credentials 🔑')
  async onCredentials(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Credentials menu 🔑:', credentialsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Hears('Reset password 🔄')
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
    await ctx.reply('Choose an option ⬇️:', mainKeyboard());
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
