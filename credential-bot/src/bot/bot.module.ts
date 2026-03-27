import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotUpdate } from './bot.update';
import { ActivityMiddleware } from './middlewares/activity.middleware';
import { AuthGuard } from './guards/auth.guard';
import { MessageCleaner } from './helpers/message-cleaner';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { CredentialsModule } from '../credentials/credentials.module';
import { SetupPasswordScene } from './scenes/auth/setup-password.scene';
import { EnterPasswordScene } from './scenes/auth/enter-password.scene';
import { CreateGroupScene } from './scenes/groups/create-group.scene';
import { EditGroupScene } from './scenes/groups/edit-group.scene';
import { DeleteGroupScene } from './scenes/groups/delete-group.scene';
import { ViewGroupsScene } from './scenes/groups/view-groups.scene';

@Module({
  imports: [
    UsersModule,
    GroupsModule,
    CredentialsModule,
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
    AuthGuard,
    MessageCleaner,
    SetupPasswordScene,
    EnterPasswordScene,
    CreateGroupScene,
    EditGroupScene,
    DeleteGroupScene,
    ViewGroupsScene,
  ],
})
export class BotModule {}
