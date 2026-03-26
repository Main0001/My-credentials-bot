import { Injectable } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialData, UpdateCredentialData } from './interfaces/credentials.interfaces';

@Injectable()
export class CredentialsService {
  constructor(private readonly credentialsRepository: CredentialsRepository) {}

  create(userId: string, data: CreateCredentialData) {
    return this.credentialsRepository.create(userId, data);
  }

  findAllByUser(userId: string) {
    return this.credentialsRepository.findAllByUser(userId);
  }

  findByGroup(userId: string, groupId: string) {
    return this.credentialsRepository.findByGroup(userId, groupId);
  }

  findWithoutGroup(userId: string) {
    return this.credentialsRepository.findWithoutGroup(userId);
  }

  findOne(credentialId: string, userId: string) {
    return this.credentialsRepository.findOne(credentialId, userId);
  }

  update(credentialId: string, userId: string, data: UpdateCredentialData) {
    return this.credentialsRepository.update(credentialId, userId, data);
  }

  delete(credentialId: string, userId: string) {
    return this.credentialsRepository.delete(credentialId, userId);
  }
}
