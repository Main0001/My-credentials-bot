import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({ where: { telegramId } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(telegramId: string, email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { telegramId, email, passwordHash },
    });
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  updateEmail(userId: string, email: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { email, pendingEmail: null, pendingEmailAt: null },
    });
  }

  setPendingEmail(
    userId: string,
    pendingEmail: string,
    pendingEmailAt: Date,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail, pendingEmailAt },
    });
  }

  clearPendingEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pendingEmail: null, pendingEmailAt: null },
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

  findInactive(threshold: Date) {
    return this.prisma.user.findMany({
      where: {
        OR: [{ lastActivityAt: { lt: threshold } }, { lastActivityAt: null }],
      },
    });
  }

  findUsersWithPendingEmailDue(now: Date) {
    return this.prisma.user.findMany({
      where: {
        pendingEmail: { not: null },
        pendingEmailAt: { lte: now },
      },
    });
  }
}
