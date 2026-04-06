import { Ctx, Wizard, WizardStep, Message, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { CredentialsService } from '../../../credentials/credentials.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { credentialsMenuKeyboard } from '../../keyboards/credentials.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { BotCommand } from '../../constants/commands.enum';
import { CallbackAction, ActionPrefix } from '../../constants/actions.enum';
import { CREDENTIALS } from '../../messages/credentials.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';

@Wizard(SceneName.ADD_CREDENTIAL)
export class AddCredentialScene {
  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly credentialsService: CredentialsService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @Command(BotCommand.CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(1)
  async stepEnterTitle(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];
    const sent = await ctx.reply(
      CREDENTIALS.ADD_TITLE_PROMPT,
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Command(BotCommand.SKIP)
  async onSkipTitle(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    botCtx.wizard.state.title = undefined;
    const sent = await ctx.reply(CREDENTIALS.ENTER_LOGIN);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(2);
  }

  @WizardStep(2)
  async stepSaveTitle(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply(COMMON.ENTER_TEXT_OR_SKIP);
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    botCtx.wizard.state.title = text;
    const sent = await ctx.reply(CREDENTIALS.ENTER_LOGIN);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(3)
  async stepEnterLogin(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply(COMMON.ENTER_TEXT_LOGIN);
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    botCtx.wizard.state.login = text;
    const sent = await ctx.reply(CREDENTIALS.ENTER_PASSWORD);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(4)
  async stepEnterPassword(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply(COMMON.ENTER_TEXT_PASSWORD);
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    botCtx.wizard.state.password = text;

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    if (!groups.length) {
      await this.saveCredential(botCtx, ctx, user!.id, undefined);
      return;
    }

    const buttons = groups.map((g) =>
      [Markup.button.callback(g.name, `${ActionPrefix.ADD_CRED_GROUP}${g.id}`)]
    );
    buttons.push([Markup.button.callback(KEYBOARDS.WITHOUT_GROUP, CallbackAction.ADD_CRED_NO_GROUP)]);

    const sent = await ctx.reply(CREDENTIALS.SELECT_GROUP, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.ADD_CRED_NO_GROUP)
  async onNoGroup(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    await this.saveCredential(botCtx, ctx, user!.id, undefined);
  }

  @Action(/^add_cred_group_/)
  async onGroupSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace(ActionPrefix.ADD_CRED_GROUP, '');

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    await this.saveCredential(botCtx, ctx, user!.id, groupId);
  }

  @WizardStep(5)
  async stepWaitForGroup(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(COMMON.SELECT_GROUP_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  private async saveCredential(
    botCtx: BotContext,
    ctx: Context,
    userId: string,
    groupId: string | undefined,
  ) {
    await this.credentialsService.create(userId, {
      title: botCtx.wizard.state.title,
      login: botCtx.wizard.state.login!,
      password: botCtx.wizard.state.password!,
      groupId,
    });

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(CREDENTIALS.ADDED, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }
}
