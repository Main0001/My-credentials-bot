import { Ctx, Wizard, WizardStep, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { mainKeyboard } from '../../keyboards/main.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('setup-password')
export class SetupPasswordScene {
  private readonly saltForHash: number;

  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    this.saltForHash = configService.get<number>('auth.saltForHash')!;
  }

  @WizardStep(1)
  async stepEnterPassword(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await ctx.reply('Welcome! Please create a password for the bot:');
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepConfirmPassword(
    @Ctx() ctx: Context,
    @Message('text') text: string,
  ) {
    const botCtx = ctx as unknown as BotContext;

    if (!text) {
      await ctx.reply('Please enter a text password:');
      return;
    }

    botCtx.wizard.state.password = text;
    await ctx.reply('Confirm your password:');
    botCtx.wizard.next();
  }

  @WizardStep(3)
  async stepSavePassword(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;

    if (!text) {
      await ctx.reply('Please confirm the text password:');
      return;
    }

    if (text !== botCtx.wizard.state.password) {
      await ctx.reply('Passwords do not match. Please enter a password again:');
      botCtx.wizard.selectStep(2);
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const passwordHash = await bcrypt.hash(text, this.saltForHash);

    const user = await this.usersService.create(telegramId, passwordHash);
    await this.usersService.updateLastActivity(user.id);

    await ctx.reply('Password set successfully!', mainKeyboard());
    await botCtx.scene.leave();
  }
}
