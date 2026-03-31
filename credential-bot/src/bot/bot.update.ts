import { Update, Start, Ctx, Hears, Action } from 'nestjs-telegraf';
import type { BotContext } from './interfaces/bot-context.interface';
import { AuthGuard } from './guards/auth.guard';
import { mainKeyboard } from './keyboards/main.keyboard';
import { groupsMenuKeyboard } from './keyboards/groups.keyboard';
import { credentialsMenuKeyboard } from './keyboards/credentials.keyboard';

@Update()
export class BotUpdate {
  constructor(private readonly authGuard: AuthGuard) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    await ctx.reply(
      `Hello, ${ctx.from?.first_name}! Welcome to Credential Bot.`,
      mainKeyboard(),
    );
  }

  @Hears('Groups')
  async onGroups(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Groups menu:', groupsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Hears('Credentials')
  async onCredentials(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Credentials menu:', credentialsMenuKeyboard());
    ctx.session.messageIds.push(sent.message_id);
  }

  @Hears('Reset password')
  async onResetPassword(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    if (!ctx.session.messageIds) ctx.session.messageIds = [];
    ctx.session.messageIds.push(ctx.message!.message_id);
    await ctx.scene.enter('reset-password');
  }

  @Action('back_to_main')
  async onBackToMain(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.reply('Choose an option:', mainKeyboard());
  }

  @Action('group_create')
  async onGroupCreate(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('create-group');
  }

  @Action('group_view')
  async onGroupView(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('view-groups');
  }

  @Action('group_edit')
  async onGroupEdit(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('edit-group');
  }

  @Action('group_delete')
  async onGroupDelete(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('delete-group');
  }

  @Action('credential_add')
  async onCredentialAdd(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('add-credential');
  }

  @Action('credential_view_all')
  async onCredentialViewAll(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('view-all-credentials');
  }

  @Action('credential_view_by_group')
  async onCredentialViewByGroup(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('view-by-group');
  }

  @Action('credential_view_no_group')
  async onCredentialViewNoGroup(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('view-without-group');
  }

  @Action('credential_edit')
  async onCredentialEdit(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('edit-credential');
  }

  @Action('credential_delete')
  async onCredentialDelete(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.answerCbQuery();
    await ctx.deleteMessage();
    await ctx.scene.enter('delete-credential');
  }
}
