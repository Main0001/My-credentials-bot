import { Ctx, Wizard, WizardStep, Message } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { mainKeyboard } from '../../keyboards/main.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';

@Wizard('enter-password')
export class EnterPasswordScene {
  private readonly maxLoginAttempts: number;

  constructor(
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    this.maxLoginAttempts = configService.get<number>('auth.maxLoginAttempts')!;
  }

  @WizardStep(1)
  async stepAskPassword(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.wizard.state.attempts = 0;
    await ctx.reply('Please enter your password:');
    botCtx.wizard.next();
  }

  @WizardStep(2)
  async stepCheckPassword(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;

    if (!text) {
      await ctx.reply('Please enter a text password:');
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);

    if (!user) {
      await botCtx.scene.enter('setup-password');
      return;
    }

    const isValid = await bcrypt.compare(text, user.passwordHash);

    if (isValid) {
      await this.usersService.updateLastActivity(user.id);
      await ctx.reply('Access granted!', mainKeyboard());
      await botCtx.scene.leave();
      return;
    }

    botCtx.wizard.state.attempts!++;

    if (botCtx.wizard.state.attempts! >= this.maxLoginAttempts) {
      await ctx.reply('Too many failed attempts. Please try again later.');
      await botCtx.scene.leave();
      return;
    }

    const remaining = this.maxLoginAttempts - botCtx.wizard.state.attempts!;
    await ctx.reply(`Wrong password. Attempts remaining: ${remaining}`);
  }
}
