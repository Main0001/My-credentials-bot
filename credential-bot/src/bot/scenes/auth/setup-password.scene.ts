import { Ctx, Wizard, WizardStep, Message, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { mainKeyboard } from '../../keyboards/main.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('setup-password')
export class SetupPasswordScene {
  private readonly saltForHash: number;
  private readonly maxConfirmAttempts: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly messageCleaner: MessageCleaner,
    configService: ConfigService,
  ) {
    this.saltForHash = configService.get<number>('auth.saltForHash')!;
    this.maxConfirmAttempts = configService.get<number>(
      'auth.maxConfirmAttempts',
    )!;
  }

  @Command('cancel')
  async onCancel(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await ctx.reply('Password setup cancelled ❌. Send /start to begin again.');
    await botCtx.scene.leave();
  }

  @WizardStep(1)
  async stepEnterPassword(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];
    botCtx.wizard.state.attempts = 0;
    const sent = await ctx.reply(
      '🔐 Welcome! Please create a password for the bot:\n\nSend /cancel to abort.',
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepConfirmPassword(
    @Ctx() ctx: Context,
    @Message('text') text: string,
  ) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply('Please enter a text password:');
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    if (text.length < 6) {
      const sent = await ctx.reply(
        '⚠️ Password must be at least 6 characters. Try again:',
      );
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    botCtx.wizard.state.password = text;
    const sent = await ctx.reply('🔁 Confirm your password:');
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @WizardStep(3)
  async stepSavePassword(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds.push(ctx.message!.message_id);

    if (!text) {
      const sent = await ctx.reply('Please confirm the text password:');
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    if (text !== botCtx.wizard.state.password) {
      botCtx.wizard.state.attempts = (botCtx.wizard.state.attempts ?? 0) + 1;

      if (botCtx.wizard.state.attempts >= this.maxConfirmAttempts) {
        await this.messageCleaner.deleteMessages(
          botCtx,
          botCtx.session.messageIds,
        );
        botCtx.session.messageIds = [];
        await ctx.reply('🚫 Too many failed attempts. Send /start to try again.');
        await botCtx.scene.leave();
        return;
      }

      const remaining = this.maxConfirmAttempts - botCtx.wizard.state.attempts;
      const sent = await ctx.reply(
        `❌ Passwords do not match. Try again (${remaining} attempts left):`,
      );
      botCtx.session.messageIds.push(sent.message_id);
      botCtx.wizard.selectStep(2);
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const passwordHash = await bcrypt.hash(text, this.saltForHash);

    const user = await this.usersService.create(telegramId, passwordHash);
    await this.usersService.updateLastActivity(user.id);

    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];

    await ctx.reply('✅ Password set successfully!', mainKeyboard());
    await botCtx.scene.leave();
  }
}
