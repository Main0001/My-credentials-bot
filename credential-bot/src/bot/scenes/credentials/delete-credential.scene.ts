import { Ctx, Wizard, WizardStep, Command, Action } from 'nestjs-telegraf';
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

@Wizard(SceneName.DELETE_CREDENTIAL)
export class DeleteCredentialScene {
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

  @Command(BotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(COMMON.USE_CANCEL_FIRST);
  }

  @WizardStep(1)
  async stepSelectSource(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    const buttons = groups
      .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
      .map((g) =>
        [Markup.button.callback(g.name, `${ActionPrefix.DEL_CRED_SRC}${g.id}`)]
      );
    buttons.push([Markup.button.callback(KEYBOARDS.WITHOUT_GROUP, CallbackAction.DEL_CRED_SRC_NONE)]);
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.DEL_CRED_CANCEL)]);

    const sent = await ctx.reply(CREDENTIALS.SELECT_GROUP_OR_NONE, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.DEL_CRED_CANCEL)
  async onCancelAction(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(CallbackAction.DEL_CRED_SRC_NONE)
  async onSourceNone(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentials = await this.credentialsService.findWithoutGroup(user!.id);
    await this.showCredentials(botCtx, ctx, credentials);
  }

  @Action(/^del_cred_src_(?!none$)/)
  async onSourceGroup(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace(ActionPrefix.DEL_CRED_SRC, '');

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentials = await this.credentialsService.findByGroup(user!.id, groupId);
    await this.showCredentials(botCtx, ctx, credentials);
  }

  private async showCredentials(botCtx: BotContext, ctx: Context, credentials: any[]) {
    if (!credentials.length) {
      await ctx.reply(CREDENTIALS.NO_CREDENTIALS_FOUND, credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const buttons = credentials
      .sort((a, b) => {
        const labelA = a.title ?? a.login;
        const labelB = b.title ?? b.login;
        return labelA > labelB ? 1 : labelA < labelB ? -1 : 0;
      })
      .map((c) => {
        const label = c.title ? `${c.title} (${c.login})` : c.login;
        return [Markup.button.callback(label, `${ActionPrefix.DEL_CRED}${c.id}`)];
      });
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.DEL_CRED_CANCEL)]);

    const sent = await ctx.reply(CREDENTIALS.SELECT_TO_DELETE, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(2);
  }

  @WizardStep(2)
  async stepWaitForSource(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(COMMON.SELECT_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(/^del_cred_(?!cancel$|confirm$|src_)/)
  async onCredentialSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    botCtx.wizard.state.credentialId = callbackData.replace(ActionPrefix.DEL_CRED, '');

    const sent = await ctx.reply(
      CREDENTIALS.DELETE_CONFIRM,
      Markup.inlineKeyboard([
        Markup.button.callback(KEYBOARDS.YES_DELETE, CallbackAction.DEL_CRED_CONFIRM),
        Markup.button.callback(KEYBOARDS.NO, CallbackAction.DEL_CRED_CANCEL),
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(3);
  }

  @WizardStep(3)
  async stepWaitForCredential(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(COMMON.SELECT_CREDENTIAL_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(CallbackAction.DEL_CRED_CONFIRM)
  async onConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentialId = botCtx.wizard.state.credentialId!;
    await this.credentialsService.delete(credentialId, user!.id);

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply(CREDENTIALS.DELETED, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(4)
  async stepWaitForConfirm(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply(COMMON.USE_BUTTONS_ABOVE);
    botCtx.session.messageIds.push(sent.message_id);
  }
}
