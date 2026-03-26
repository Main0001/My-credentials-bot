import { Injectable } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
import { CreateCredentialData, UpdateCredentialData } from './interfaces/credentials.interfaces';
import { CryptoHelper } from '../bot/helpers/crypto.helper';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly credentialsRepository: CredentialsRepository,
    private readonly cryptoHelper: CryptoHelper,
  ) {}

  create(userId: string, data: CreateCredentialData) {
    return this.credentialsRepository.create(userId, {
      ...data,
      password: this.cryptoHelper.encrypt(data.password),
    });
  }

  async findAllByUser(userId: string) {
    const credentials = await this.credentialsRepository.findAllByUser(userId);
    return credentials.map((c) => ({
      ...c,
      password: this.cryptoHelper.decrypt(c.password),
    }));
  }

  async findByGroup(userId: string, groupId: string) {
    const credentials = await this.credentialsRepository.findByGroup(userId, groupId);
    return credentials.map((c) => ({
      ...c,
      password: this.cryptoHelper.decrypt(c.password),
    }));
  }

  async findWithoutGroup(userId: string) {
    const credentials = await this.credentialsRepository.findWithoutGroup(userId);
    return credentials.map((c) => ({
      ...c,
      password: this.cryptoHelper.decrypt(c.password),
    }));
  }

  async findOne(credentialId: string, userId: string) {
    const credential = await this.credentialsRepository.findOne(credentialId, userId);
    if (!credential) return null;
    return { ...credential, password: this.cryptoHelper.decrypt(credential.password) };
  }

  update(credentialId: string, userId: string, data: UpdateCredentialData) {
    const encrypted = data.password
      ? { ...data, password: this.cryptoHelper.encrypt(data.password) }
      : data;
    return this.credentialsRepository.update(credentialId, userId, encrypted);
  }

  delete(credentialId: string, userId: string) {
    return this.credentialsRepository.delete(credentialId, userId);
  }
}
