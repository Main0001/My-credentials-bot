import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import type { AsyncSessionStore } from 'telegraf/session';
import { BotUpdate } from './bot.update';
import { AuthGuard } from './guards/auth.guard';
import { MessageCleaner } from './helpers/message-cleaner';
import { InactivityCleanupService } from './cleanup/inactivity-cleanup.service';
import { RedisSessionStore } from './session/redis-session.store';
import { trackMessageIdMiddleware } from './middleware/track-message-id.middleware';
import type { BotSession } from './interfaces/bot-context.interface';
import { RedisService } from '@/redis/redis.service';
import { UsersModule } from '@/users/users.module';
import { GroupsModule } from '@/groups/groups.module';
import { CredentialsModule } from '@/credentials/credentials.module';
import { SetupPasswordScene } from './scenes/auth/setup-password.scene';
import { EnterPasswordScene } from './scenes/auth/enter-password.scene';
import { ResetPasswordScene } from './scenes/auth/reset-password.scene';
import { LogoutScene } from './scenes/auth/logout.scene';
import { CreateGroupScene } from './scenes/groups/create-group.scene';
import { EditGroupScene } from './scenes/groups/edit-group.scene';
import { DeleteGroupScene } from './scenes/groups/delete-group.scene';
import { ViewGroupsScene } from './scenes/groups/view-groups.scene';
import { AddCredentialScene } from './scenes/credentials/add-credential.scene';
import { ViewAllCredentialsScene } from './scenes/credentials/view-all-credentials.scene';
import { ViewByGroupScene } from './scenes/credentials/view-by-group.scene';
import { ViewWithoutGroupScene } from './scenes/credentials/view-without-group.scene';
import { EditCredentialScene } from './scenes/credentials/edit-credential.scene';
import { DeleteCredentialScene } from './scenes/credentials/delete-credential.scene';

@Module({
  imports: [
    UsersModule,
    GroupsModule,
    CredentialsModule,
    TelegrafModule.forRootAsync({
      useFactory: (
        configService: ConfigService,
        redisService: RedisService,
      ) => {
        const sessionStore = new RedisSessionStore(redisService, configService);
        return {
          token: configService.get<string>('telegram.token')!,
          middlewares: [
            session({
              store: sessionStore as AsyncSessionStore<BotSession>,
              defaultSession: () => ({ messageIds: [] }) as BotSession,
            }),
            trackMessageIdMiddleware,
          ],
        };
      },
      inject: [ConfigService, RedisService],
    }),
  ],
  providers: [
    BotUpdate,
    AuthGuard,
    MessageCleaner,
    InactivityCleanupService,
    SetupPasswordScene,
    EnterPasswordScene,
    ResetPasswordScene,
    LogoutScene,
    CreateGroupScene,
    EditGroupScene,
    DeleteGroupScene,
    ViewGroupsScene,
    AddCredentialScene,
    ViewAllCredentialsScene,
    ViewByGroupScene,
    ViewWithoutGroupScene,
    EditCredentialScene,
    DeleteCredentialScene,
  ],
})
export class BotModule {}
