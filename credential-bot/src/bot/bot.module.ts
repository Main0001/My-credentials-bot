import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotUpdate } from './bot.update';
import { ActivityMiddleware } from './middlewares/activity.middleware';
import { UsersModule } from '../users/users.module';
import { SetupPasswordScene } from './scenes/auth/setup-password.scene';
import { EnterPasswordScene } from './scenes/auth/enter-password.scene';

@Module({
  imports: [
    UsersModule,
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('telegram.token')!,
        middlewares: [session()],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    BotUpdate,
    ActivityMiddleware,
    SetupPasswordScene,
    EnterPasswordScene,
  ],
})
export class BotModule {}
