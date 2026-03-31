import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BotContext } from '../interfaces/bot-context.interface';
import dayjs from 'dayjs';
import { UsersService } from '../../users/users.service';
import { MessageCleaner } from '../helpers/message-cleaner';

@Injectable()
export class AuthGuard {
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
      return false;
    }

    const user = await this.usersService.findByTelegramId(telegramId);

    if (!user) {
      await ctx.scene.enter('setup-password');
      return false;
    }

    if (this.isSessionExpired(user.lastActivityAt)) {
      if (ctx.session?.messageIds?.length) {
        await this.messageCleaner.deleteMessages(ctx, ctx.session.messageIds);
        ctx.session.messageIds = [];
      }

      await ctx.scene.enter('enter-password');
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
