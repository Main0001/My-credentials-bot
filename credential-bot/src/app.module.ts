import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configuration } from './config/config';
import { PrismaModule } from './prisma/prisma.module';
import { BotModule } from './bot/bot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
