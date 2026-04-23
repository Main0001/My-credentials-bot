import { Ctx, Wizard, WizardStep, Message, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Logger } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { GroupsService } from '@/groups/groups.service';
import { CredentialsService } from '@/credentials/credentials.service';
import { MessageCleaner } from '@/bot/helpers/message-cleaner';
import { credentialsMenuKeyboard } from '@/bot/keyboards/credentials.keyboard';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';
import { SceneName } from '@/bot/constants/scenes.enum';
import { BotCommand } from '@/bot/constants/commands.enum';
import { CallbackAction, ActionPrefix } from '@/bot/constants/actions.enum';
import { CREDENTIALS, formatCredentialLine } from '@/bot/messages/credentials.messages';
import { COMMON } from '@/bot/messages/common.messages';
import { KEYBOARDS } from '@/bot/messages/keyboards.messages';

const FIELD_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback(KEYBOARDS.TITLE, CallbackAction.EDIT_CRED_FIELD_TITLE),
    Markup.button.callback(KEYBOARDS.LOGIN, CallbackAction.EDIT_CRED_FIELD_LOGIN),
  ],
  [Markup.button.callback(KEYBOARDS.PASSWORD, CallbackAction.EDIT_CRED_FIELD_PASSWORD)],
  [Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.EDIT_CRED_CANCEL)],
]);

@Wizard(SceneName.EDIT_CREDENTIAL)
export class EditCredentialScene {
  private readonly logger = new Logger(EditCredentialScene.name);
  private editField: string = '';

  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly credentialsService: CredentialsService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @Command(BotCommand.CANCEL)
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
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
        [Markup.button.callback(g.name, `${ActionPrefix.EDIT_CRED_SRC}${g.id}`)]
      );
    buttons.push([Markup.button.callback(KEYBOARDS.WITHOUT_GROUP, CallbackAction.EDIT_CRED_SRC_NONE)]);
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.EDIT_CRED_CANCEL)]);

    const sent = await ctx.reply(CREDENTIALS.SELECT_GROUP_OR_NONE, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.EDIT_CRED_CANCEL)
  async onCancelAction(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply(COMMON.CANCELLED, credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action(CallbackAction.EDIT_CRED_SRC_NONE)
  async onSourceNone(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentials = await this.credentialsService.findWithoutGroup(user!.id);
    await this.showCredentials(botCtx, ctx, credentials);
  }

  @Action(/^edit_cred_src_(?!none$)/)
  async onSourceGroup(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const groupId = callbackData.replace(ActionPrefix.EDIT_CRED_SRC, '');

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
        return [Markup.button.callback(label, `${ActionPrefix.EDIT_CRED}${c.id}`)];
      });
    buttons.push([Markup.button.callback(KEYBOARDS.CANCEL, CallbackAction.EDIT_CRED_CANCEL)]);

    const sent = await ctx.reply(CREDENTIALS.SELECT_TO_EDIT, Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(2);
  }

  @WizardStep(2)
  async stepWaitForSource(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    const sent = await ctx.reply(COMMON.SELECT_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(/^edit_cred_(?!cancel$|field_|src_)/)
  async onCredentialSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    const credentialId = callbackData.replace(ActionPrefix.EDIT_CRED, '');
    botCtx.wizard.state.credentialId = credentialId;

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credential = await this.credentialsService.findOne(credentialId, user!.id);

    const line = formatCredentialLine(credential!.title, credential!.login, credential!.password);
    const sent = await ctx.reply(CREDENTIALS.CURRENT_CREDENTIAL(line), {
      parse_mode: 'HTML',
      ...FIELD_KEYBOARD,
    });
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(4);
  }

  @WizardStep(3)
  async stepWaitForCredential(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    const sent = await ctx.reply(COMMON.SELECT_CREDENTIAL_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(/^edit_cred_field_/)
  async onFieldSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    this.editField = callbackData.replace(ActionPrefix.EDIT_CRED_FIELD, '');

    const sent = await ctx.reply(CREDENTIALS.ENTER_NEW_FIELD(this.editField));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(5);
  }

  @WizardStep(4)
  async stepWaitForField(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    const sent = await ctx.reply(COMMON.SELECT_FIELD_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @WizardStep(5)
  async stepWaitForField2(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    const sent = await ctx.reply(COMMON.SELECT_FIELD_FROM_BUTTONS);
    botCtx.session.messageIds.push(sent.message_id);
  }

  @WizardStep(6)
  async stepSaveField(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;

    if (!text) {
      const sent = await ctx.reply(CREDENTIALS.ENTER_TEXT_FIELD(this.editField));
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentialId = botCtx.wizard.state.credentialId!;

    await this.credentialsService.update(credentialId, user!.id, {
      [this.editField]: text,
    });
    this.logger.log(
      `Credential field updated: credentialId=${credentialId}, userId=${user!.id}, field=${this.editField}`,
    );

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    const updated = await this.credentialsService.findOne(credentialId, user!.id);
    const line = formatCredentialLine(updated!.title, updated!.login, updated!.password);
    const sent = await ctx.reply(CREDENTIALS.FIELD_UPDATED(this.editField, line), {
      parse_mode: 'HTML',
      ...FIELD_KEYBOARD,
    });
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(4);
  }
}
