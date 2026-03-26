import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { BotContext } from '../interfaces/bot-context.interface';
import dayjs from 'dayjs';
import { UsersService } from '../../users/users.service';
import { MessageCleaner } from '../helpers/message-cleaner';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly inactivityTimeoutHours: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly messageCleaner: MessageCleaner,
    configService: ConfigService,
  ) {
    this.inactivityTimeoutHours = configService.get<number>('auth.inactivityTimeoutHours')!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = TelegrafExecutionContext.create(context).getContext<BotContext>();
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

    ctx.state.user = user;
    return true;
  }

  private isSessionExpired(lastActivityAt: Date | null): boolean {
    if (!lastActivityAt) {
      return true;
    }

    return dayjs().diff(dayjs(lastActivityAt), 'hour') >= this.inactivityTimeoutHours;
  }
}
