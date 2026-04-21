import { Ctx, Wizard, WizardStep, Message, Action, Command } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { UsersService } from '../../../users/users.service';
import { MessageCleaner } from '../../helpers/message-cleaner';
import { mainKeyboard } from '../../keyboards/main.keyboard';
import type { BotContext } from '../../interfaces/bot-context.interface';
import { SceneName } from '../../constants/scenes.enum';
import { BotCommand } from '../../constants/commands.enum';
import { CallbackAction } from '../../constants/actions.enum';
import { AUTH } from '../../messages/auth.messages';
import { COMMON } from '../../messages/common.messages';
import { KEYBOARDS } from '../../messages/keyboards.messages';

@Wizard(SceneName.ENTER_PASSWORD)
export class EnterPasswordScene {
  private readonly logger = new Logger(EnterPasswordScene.name);
  private readonly maxLoginAttempts: number;
  private readonly lockoutDurationMinutes: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly messageCleaner: MessageCleaner,
    configService: ConfigService,
  ) {
    this.maxLoginAttempts = configService.get<number>('auth.maxLoginAttempts')!;
    this.lockoutDurationMinutes = configService.get<number>(
      'auth.lockoutDurationMinutes',
    )!;
  }

  @Command(BotCommand.MENU)
  async onMenuAttempt(@Ctx() ctx: Context) {
    await ctx.reply(
      AUTH.ENTER_PASSWORD,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            KEYBOARDS.RESET_PASSWORD,
            CallbackAction.ENTER_PW_RESET,
          ),
        ],
      ]),
    );
  }

  @Command(BotCommand.CANCEL)
  async onCancelAttempt(@Ctx() ctx: Context) {
    await ctx.reply(
      AUTH.ENTER_PASSWORD,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            KEYBOARDS.RESET_PASSWORD,
            CallbackAction.ENTER_PW_RESET,
          ),
        ],
      ]),
    );
  }

  @WizardStep(1)
  async stepAskPassword(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    botCtx.session.messageIds = [];

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);

    if (user?.lockedUntil && dayjs(user.lockedUntil).isAfter(dayjs())) {
      const minutesLeft = dayjs(user.lockedUntil).diff(dayjs(), 'minute') + 1;
      this.logger.warn(
        `Login blocked (still locked): telegramId=${telegramId}, minutesLeft=${minutesLeft}`,
      );
      await ctx.reply(AUTH.LOCKED_OUT(minutesLeft));
      await botCtx.scene.leave();
      return;
    }

    const sent = await ctx.reply(
      AUTH.ENTER_PASSWORD,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            KEYBOARDS.RESET_PASSWORD,
            CallbackAction.ENTER_PW_RESET,
          ),
        ],
      ]),
    );
    botCtx.session.messageIds.push(sent.message_id);
    botCtx.wizard.next();
  }

  @Action(CallbackAction.ENTER_PW_RESET)
  async onReset(@Ctx() ctx: Context) {
    const botCtx = ctx as unknown as BotContext;
    await botCtx.answerCbQuery();
    await botCtx.deleteMessage();
    await this.messageCleaner.deleteMessages(botCtx, botCtx.session.messageIds);
    botCtx.session.messageIds = [];
    await botCtx.scene.enter(SceneName.RESET_PASSWORD);
  }

  @WizardStep(2)
  async stepCheckPassword(@Ctx() ctx: Context, @Message('text') text: string) {
    const botCtx = ctx as unknown as BotContext;

    if (!text) {
      const sent = await ctx.reply(COMMON.ENTER_TEXT_PASSWORD);
      botCtx.session.messageIds.push(sent.message_id);
      return;
    }

    const telegramId = ctx.from!.id.toString();
    const user = await this.usersService.findByTelegramId(telegramId);

    if (!user) {
      await this.messageCleaner.deleteMessages(
        botCtx,
        botCtx.session.messageIds,
      );
      botCtx.session.messageIds = [];
      await botCtx.scene.enter(SceneName.SETUP_PASSWORD);
      return;
    }

    const isValid = await bcrypt.compare(text, user.passwordHash);

    if (isValid) {
      this.logger.log(`Login success: telegramId=${telegramId}`);
      await this.usersService.resetFailedAttempts(user.id);
      await this.usersService.updateLastActivity(user.id);
      await this.messageCleaner.deleteMessages(
        botCtx,
        botCtx.session.messageIds,
      );
      botCtx.session.messageIds = [];
      await ctx.reply(AUTH.ACCESS_GRANTED, mainKeyboard());
      await botCtx.scene.leave();
      return;
    }

    const updated = await this.usersService.incrementFailedAttempts(user.id);
    this.logger.warn(
      `Login failed: telegramId=${telegramId}, attempts=${updated.failedLoginAttempts}/${this.maxLoginAttempts}`,
    );

    if (updated.failedLoginAttempts >= this.maxLoginAttempts) {
      const lockedUntil = dayjs()
        .add(this.lockoutDurationMinutes, 'minute')
        .toDate();
      await this.usersService.setLockout(user.id, lockedUntil);
      this.logger.error(
        `Account locked out: telegramId=${telegramId}, until=${lockedUntil.toISOString()}`,
      );
      await this.messageCleaner.deleteMessages(
        botCtx,
        botCtx.session.messageIds,
      );
      botCtx.session.messageIds = [];
      await ctx.reply(AUTH.LOCKED_OUT(this.lockoutDurationMinutes));
      await botCtx.scene.leave();
      return;
    }

    const remaining = this.maxLoginAttempts - updated.failedLoginAttempts;
    const sent = await ctx.reply(AUTH.WRONG_PASSWORD(remaining));
    botCtx.session.messageIds.push(sent.message_id);
  }
}
