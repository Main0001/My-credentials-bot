import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ActivityMiddleware {
  constructor(private readonly usersService: UsersService) {}

  async update(ctx: Context, next: () => Promise<void>) {
    const telegramId = ctx.from?.id?.toString();

    if (telegramId) {
      const user = await this.usersService.findByTelegramId(telegramId);

      if (user) {
        await this.usersService.updateLastActivity(user.id);
      }
    }

    await next();
  }
}
