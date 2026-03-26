import { Injectable } from '@nestjs/common';
import { GroupsRepository } from './groups.repository';

@Injectable()
export class GroupsService {
  constructor(private readonly groupsRepository: GroupsRepository) {}

  create(userId: string, name: string) {
    return this.groupsRepository.create(userId, name);
  }

  findAllByUser(userId: string) {
    return this.groupsRepository.findAllByUser(userId);
  }

  findOne(groupId: string, userId: string) {
    return this.groupsRepository.findOne(groupId, userId);
  }

  update(groupId: string, userId: string, name: string) {
    return this.groupsRepository.update(groupId, userId, name);
  }

  delete(groupId: string, userId: string) {
    return this.groupsRepository.delete(groupId, userId);
  }
}
