import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  create(telegramId: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { telegramId, passwordHash },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  updateLastActivity(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    });
  }

  clearLastActivity(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: null },
    });
  }

  delete(userId: string) {
    return this.prisma.user.delete({ where: { id: userId } });
  }

  incrementFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  }

  resetFailedAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  setLockout(userId: string, lockedUntil: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil },
    });
  }
}
