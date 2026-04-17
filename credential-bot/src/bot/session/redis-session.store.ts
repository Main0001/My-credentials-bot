import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AsyncSessionStore } from 'telegraf/session';
import { RedisService } from '../../redis/redis.service';
import type { BotSession } from '../interfaces/bot-context.interface';

@Injectable()
export class RedisSessionStore implements AsyncSessionStore<BotSession> {
  private readonly keyPrefix = 'session:';
  private readonly ttlSeconds?: number;

  constructor(
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds = configService.get<number>('redis.sessionTtlSeconds');
  }

  async get(key: string): Promise<BotSession | undefined> {
    const raw = await this.redis.client.get(this.keyPrefix + key);
    return raw ? (JSON.parse(raw) as BotSession) : undefined;
  }

  async set(key: string, value: BotSession): Promise<void> {
    const fullKey = this.keyPrefix + key;
    const payload = JSON.stringify(value);
    if (this.ttlSeconds) {
      await this.redis.client.set(fullKey, payload, { EX: this.ttlSeconds });
    } else {
      await this.redis.client.set(fullKey, payload);
    }
  }

  async delete(key: string): Promise<void> {
    await this.redis.client.del(this.keyPrefix + key);
  }
}
