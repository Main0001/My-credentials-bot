import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BotContext } from '@/bot/interfaces/bot-context.interface';
import dayjs from 'dayjs';
import { UsersService } from '@/users/users.service';
import { MessageCleaner } from '@/bot/helpers/message-cleaner';
import { SceneName } from '@/bot/constants/scenes.enum';

@Injectable()
export class AuthGuard {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly inactivityTimeoutHours: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly messageCleaner: MessageCleaner,
    configService: ConfigService,
  ) {
    this.inactivityTimeoutHours = configService.get<number>(
      'auth.inactivityTimeoutHours',
    )!;
  }

  async validate(ctx: BotContext): Promise<boolean> {
    const telegramId = ctx.from?.id?.toString();

    if (!telegramId) {
      this.logger.warn('Validation failed: missing telegramId');
      return false;
    }

    const user = await this.usersService.findByTelegramId(telegramId);

    if (!user) {
      this.logger.log(`Unknown user, entering setup: telegramId=${telegramId}`);
      await ctx.scene.enter(SceneName.SETUP_PASSWORD);
      return false;
    }

    if (this.isSessionExpired(user.lastActivityAt)) {
      this.logger.log(
        `Session expired, re-auth required: telegramId=${telegramId}`,
      );
      if (ctx.session?.messageIds?.length) {
        await this.messageCleaner.deleteMessages(ctx, ctx.session.messageIds);
        ctx.session.messageIds = [];
      }

      await ctx.scene.enter(SceneName.ENTER_PASSWORD);
      return false;
    }

    await this.usersService.updateLastActivity(user.id);
    ctx.state.user = user;
    return true;
  }

  private isSessionExpired(lastActivityAt: Date | null): boolean {
    if (!lastActivityAt) {
      return true;
    }

    return (
      dayjs().diff(dayjs(lastActivityAt), 'hour') >= this.inactivityTimeoutHours
    );
  }
}
