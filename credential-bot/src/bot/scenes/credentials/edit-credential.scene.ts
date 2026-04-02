import { Ctx, Wizard, WizardStep, Message, Command, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UsersService } from '../../../users/users.service';
import { GroupsService } from '../../../groups/groups.service';
import { CredentialsService } from '../../../credentials/credentials.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { credentialsMenuKeyboard } from '../../keyboards/credentials.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

const FIELD_KEYBOARD = Markup.inlineKeyboard([
  [
    Markup.button.callback('Title 📝', 'edit_cred_field_title'),
    Markup.button.callback('Login 🔤', 'edit_cred_field_login'),
  ],
  [Markup.button.callback('Password 🔑', 'edit_cred_field_password')],
  [Markup.button.callback('Cancel ↩️', 'edit_cred_cancel')],
]);

@Wizard('edit-credential')
export class EditCredentialScene {
  private editField: string = '';

  constructor(
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly credentialsService: CredentialsService,
    private readonly messageCleaner: MessageCleaner,
  ) {}

  @Command('cancel')
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply('↩️ Cancelled.', credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @WizardStep(1)
  async stepSelectSource(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const groups = await this.groupsService.findAllByUser(user!.id);

    const buttons = groups.map((g) =>
      [Markup.button.callback(g.name, `edit_cred_src_${g.id}`)]
    );
    buttons.push([Markup.button.callback('Without group 📄', 'edit_cred_src_none')]);
    buttons.push([Markup.button.callback('Cancel ↩️', 'edit_cred_cancel')]);

    const sent = await ctx.reply('📁 Select group or "Without group":', Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action('edit_cred_cancel')
  async onCancelAction(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply('↩️ Cancelled.', credentialsMenuKeyboard());
    await botCtx.scene.leave();
  }

  @Action('edit_cred_src_none')
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
    const groupId = callbackData.replace('edit_cred_src_', '');

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentials = await this.credentialsService.findByGroup(user!.id, groupId);
    await this.showCredentials(botCtx, ctx, credentials);
  }

  private async showCredentials(botCtx: BotContext, ctx: Context, credentials: any[]) {
    if (!credentials.length) {
      await ctx.reply('ℹ️ No credentials found.', credentialsMenuKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const buttons = credentials.map((c) => {
      const label = c.title ? `${c.title} (${c.login})` : c.login;
      return [Markup.button.callback(label, `edit_cred_${c.id}`)];
    });
    buttons.push([Markup.button.callback('Cancel ↩️', 'edit_cred_cancel')]);

    const sent = await ctx.reply('✏️ Select credential to edit:', Markup.inlineKeyboard(buttons));
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(2);
  }

  @WizardStep(2)
  async stepWaitForSource(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Please select from the buttons above.');
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(/^edit_cred_(?!cancel$|field_|src_)/)
  async onCredentialSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    botCtx.wizard.state.credentialId = callbackData.replace('edit_cred_', '');

    const sent = await ctx.reply('✏️ What do you want to edit?', FIELD_KEYBOARD);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(4);
  }

  @WizardStep(3)
  async stepWaitForCredential(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Please select a credential from the buttons above.');
    botCtx.session.messageIds.push(sent.message_id);
  }

  @Action(/^edit_cred_field_/)
  async onFieldSelected(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();

    const callbackData = (ctx as any).callbackQuery.data as string;
    this.editField = callbackData.replace('edit_cred_field_', '');

    const sent = await ctx.reply(`📝 Enter new ${this.editField}:`);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(5);
  }

  @WizardStep(4)
  async stepWaitForField(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Please select a field from the buttons above.');
    botCtx.session.messageIds.push(sent.message_id);
  }

  @WizardStep(5)
  async stepWaitForField2(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    const sent = await ctx.reply('Please select a field from the buttons above.');
    botCtx.session.messageIds.push(sent.message_id);
  }

  @WizardStep(6)
  async stepSaveField(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply(`Please enter a text ${this.editField}:`);
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);
    const credentialId = botCtx.wizard.state.credentialId!;

    await this.credentialsService.update(credentialId, user!.id, {
      [this.editField]: text,
    });

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    const sent = await ctx.reply(`✅ ${this.editField} updated!\n\n✏️ What do you want to edit?`, FIELD_KEYBOARD);
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.selectStep(4);
  }
}
