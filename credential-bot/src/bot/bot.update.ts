import { Update, Start, Ctx, Use, Hears, Action, Next } from 'nestjs-telegraf';
import type { BotContext } from './interfaces/bot-context.interface';
import { ActivityMiddleware } from './middlewares/activity.middleware';
import { AuthGuard } from './guards/auth.guard';
import { mainKeyboard } from './keyboards/main.keyboard';
import { groupsMenuKeyboard } from './keyboards/groups.keyboard';
import { credentialsMenuKeyboard } from './keyboards/credentials.keyboard';

@Update()
export class BotUpdate {
  constructor(
    private readonly activityMiddleware: ActivityMiddleware,
    private readonly authGuard: AuthGuard,
  ) {}

  @Use()
  async onUse(@Ctx() ctx: BotContext, @Next() next: () => Promise<void>) {
    await this.activityMiddleware.update(ctx, next);
  }

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
    await ctx.reply('Groups menu:', groupsMenuKeyboard());
  }

  @Hears('Credentials')
  async onCredentials(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
    await ctx.reply('Credentials menu:', credentialsMenuKeyboard());
  }

  @Hears('Reset password')
  async onResetPassword(@Ctx() ctx: BotContext) {
    if (!(await this.authGuard.validate(ctx))) return;
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
}
