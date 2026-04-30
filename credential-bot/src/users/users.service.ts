import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByTelegramId(telegramId: string) {
    return this.usersRepository.findByTelegramId(telegramId);
  }

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  create(telegramId: string, email: string, passwordHash: string) {
    return this.usersRepository.create(telegramId, email, passwordHash);
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersRepository.updatePassword(userId, passwordHash);
  }

  updateEmail(userId: string, email: string) {
    return this.usersRepository.updateEmail(userId, email);
  }

  setPendingEmail(
    userId: string,
    pendingEmail: string,
    pendingEmailAt: Date,
  ) {
    return this.usersRepository.setPendingEmail(
      userId,
      pendingEmail,
      pendingEmailAt,
    );
  }

  clearPendingEmail(userId: string) {
    return this.usersRepository.clearPendingEmail(userId);
  }

  updateLastActivity(userId: string) {
    return this.usersRepository.updateLastActivity(userId);
  }

  clearLastActivity(userId: string) {
    return this.usersRepository.clearLastActivity(userId);
  }

  delete(userId: string) {
    return this.usersRepository.delete(userId);
  }

  incrementFailedAttempts(userId: string) {
    return this.usersRepository.incrementFailedAttempts(userId);
  }

  resetFailedAttempts(userId: string) {
    return this.usersRepository.resetFailedAttempts(userId);
  }

  setLockout(userId: string, lockedUntil: Date) {
    return this.usersRepository.setLockout(userId, lockedUntil);
  }

  findInactive(hours: number) {
    const threshold = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.usersRepository.findInactive(threshold);
  }

  findUsersWithPendingEmailDue(now: Date) {
    return this.usersRepository.findUsersWithPendingEmailDue(now);
  }
}
