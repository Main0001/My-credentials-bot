import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByTelegramId(telegramId: string) {
    return this.usersRepository.findByTelegramId(telegramId);
  }

  create(telegramId: string, passwordHash: string) {
    return this.usersRepository.create(telegramId, passwordHash);
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.usersRepository.updatePassword(userId, passwordHash);
  }

  updateLastActivity(userId: string) {
    return this.usersRepository.updateLastActivity(userId);
  }

  delete(userId: string) {
    return this.usersRepository.delete(userId);
  }
}
