import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AsyncSessionStore } from 'telegraf/session';
import { RedisService } from '../../redis/redis.service';
import type { BotSession } from '../interfaces/bot-context.interface';

@Injectable()
export class RedisSessionStore implements AsyncSessionStore<BotSession> {
  private readonly logger = new Logger(RedisSessionStore.name);
  private readonly keyPrefix = 'session:';
  private readonly ttlSeconds?: number;

  constructor(
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds = configService.get<number>('redis.sessionTtlSeconds');
  }

  async get(key: string): Promise<BotSession | undefined> {
    try {
      const raw = await this.redis.client.get(this.keyPrefix + key);
      return raw ? (JSON.parse(raw) as BotSession) : undefined;
    } catch (err) {
      this.logger.error(
        `Session GET failed: key=${key}, error=${(err as Error).message}`,
      );
      return undefined;
    }
  }

  async set(key: string, value: BotSession): Promise<void> {
    const fullKey = this.keyPrefix + key;
    const payload = JSON.stringify(value);
    try {
      if (this.ttlSeconds) {
        await this.redis.client.set(fullKey, payload, { EX: this.ttlSeconds });
      } else {
        await this.redis.client.set(fullKey, payload);
      }
    } catch (err) {
      this.logger.error(
        `Session SET failed: key=${key}, error=${(err as Error).message}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.client.del(this.keyPrefix + key);
    } catch (err) {
      this.logger.error(
        `Session DELETE failed: key=${key}, error=${(err as Error).message}`,
      );
    }
  }
}
