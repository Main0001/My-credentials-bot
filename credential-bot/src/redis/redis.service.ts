import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: RedisClientType;

  constructor(configService: ConfigService) {
    const host = configService.get<string>('redis.host')!;
    const port = configService.get<number>('redis.port')!;
    const password = configService.get<string>('redis.password');

    this.client = createClient({
      socket: { host, port },
      ...(password && { password }),
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`);
    });
  }

  async onModuleInit() {
    await this.client.connect();
    this.logger.log('Redis client connected');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
