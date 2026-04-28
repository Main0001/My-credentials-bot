import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { UsersService } from '@/users/users.service';
import { RedisService } from '@/redis/redis.service';
import type {
  BotContext,
  BotSession,
} from '@/bot/interfaces/bot-context.interface';

@Injectable()
export class InactivityCleanupService {
  private readonly logger = new Logger(InactivityCleanupService.name);
  private readonly inactivityTimeoutHours: number;
  private readonly sessionKeyPrefix = 'session:';

  constructor(
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.inactivityTimeoutHours = configService.get<number>(
      'auth.inactivityTimeoutHours',
    )!;
  }

  @Cron(CronExpression.EVERY_3_HOURS) //.EVERY_30_MINUTES)
  async cleanup() {
    const users = await this.usersService.findInactive(
      this.inactivityTimeoutHours,
    );
    if (!users.length) return;

    this.logger.log(`Cleanup: ${users.length} inactive user(s)`);

    for (const user of users) {
      await this.cleanupUser(user.telegramId);
    }
  }

  private async cleanupUser(telegramId: string) {
    const sessionKey = `${this.sessionKeyPrefix}${telegramId}:${telegramId}`;
    const raw = await this.redis.client.get(sessionKey);
    if (!raw) return;

    const session = JSON.parse(raw) as BotSession;
    const chatId = Number(telegramId);
    const ids = [...(session.messageIds ?? [])];
    if (session.menuMessageId) ids.push(session.menuMessageId);
    if (!ids.length) return;

    let failures = 0;
    for (const messageId of ids) {
      try {
        await this.bot.telegram.deleteMessage(chatId, messageId);
      } catch (err) {
        failures++;
        this.logger.debug(
          `Skip deleteMessage: chatId=${chatId}, messageId=${messageId}, error=${(err as Error).message}`,
        );
      }
    }

    session.messageIds = [];
    session.menuMessageId = undefined;
    await this.redis.client.set(sessionKey, JSON.stringify(session), {
      KEEPTTL: true,
    });

    this.logger.log(
      `Cleaned ${ids.length - failures}/${ids.length} message(s) for telegramId=${telegramId}`,
    );
  }
}
