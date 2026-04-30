import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { RedisService } from '@/redis/redis.service';
import type { MailPurpose } from '@/mail/mail.service';

type StoredAuthCode = {
  codeHash: string;
  email: string;
  attempts: number;
  payload?: Record<string, unknown>;
};

export type VerifyResult =
  | { ok: true; email: string; payload?: Record<string, unknown> }
  | {
      ok: false;
      reason: 'expired' | 'wrong' | 'too_many';
      remaining?: number;
    };

@Injectable()
export class AuthCodeService {
  private readonly logger = new Logger(AuthCodeService.name);
  private readonly keyPrefix = 'authcode:';
  private readonly ttlSeconds: number;
  private readonly maxAttempts: number;
  private readonly saltRounds: number;

  constructor(
    private readonly redis: RedisService,
    configService: ConfigService,
  ) {
    this.ttlSeconds =
      configService.get<number>('auth.emailCodeTtlMinutes')! * 60;
    this.maxAttempts = configService.get<number>(
      'auth.emailCodeMaxAttempts',
    )!;
    this.saltRounds = configService.get<number>('auth.saltForHash')!;
  }

  async generate(
    telegramId: string,
    email: string,
    purpose: MailPurpose,
    payload?: Record<string, unknown>,
  ): Promise<string> {
    const code = randomInt(100_000, 1_000_000).toString();
    const codeHash = await bcrypt.hash(code, this.saltRounds);
    const value: StoredAuthCode = { codeHash, email, attempts: 0, payload };
    await this.redis.client.set(
      this.key(purpose, telegramId),
      JSON.stringify(value),
      { EX: this.ttlSeconds },
    );
    this.logger.log(
      `Code generated: purpose=${purpose}, telegramId=${telegramId}`,
    );
    return code;
  }

  async verify(
    telegramId: string,
    purpose: MailPurpose,
    code: string,
  ): Promise<VerifyResult> {
    const key = this.key(purpose, telegramId);
    const raw = await this.redis.client.get(key);
    if (!raw) return { ok: false, reason: 'expired' };

    const stored = JSON.parse(raw) as StoredAuthCode;
    const matches = await bcrypt.compare(code, stored.codeHash);
    if (matches) {
      await this.redis.client.del(key);
      return { ok: true, email: stored.email, payload: stored.payload };
    }

    stored.attempts += 1;
    if (stored.attempts >= this.maxAttempts) {
      await this.redis.client.del(key);
      this.logger.warn(
        `Code locked out: purpose=${purpose}, telegramId=${telegramId}`,
      );
      return { ok: false, reason: 'too_many' };
    }

    await this.redis.client.set(key, JSON.stringify(stored), {
      KEEPTTL: true,
    });
    return {
      ok: false,
      reason: 'wrong',
      remaining: this.maxAttempts - stored.attempts,
    };
  }

  private key(purpose: MailPurpose, telegramId: string): string {
    return `${this.keyPrefix}${purpose}:${telegramId}`;
  }
}
