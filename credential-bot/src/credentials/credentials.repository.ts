import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCredentialData, UpdateCredentialData } from './interfaces/credentials.interfaces';

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateCredentialData) {
    return this.prisma.credential.create({
      data: { userId, ...data },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.credential.findMany({ where: { userId } });
  }

  findByGroup(userId: string, groupId: string) {
    return this.prisma.credential.findMany({ where: { userId, groupId } });
  }

  findWithoutGroup(userId: string) {
    return this.prisma.credential.findMany({
      where: { userId, groupId: null },
    });
  }

  findOne(credentialId: string, userId: string) {
    return this.prisma.credential.findFirst({
      where: { id: credentialId, userId },
    });
  }

  update(credentialId: string, userId: string, data: UpdateCredentialData) {
    return this.prisma.credential.update({
      where: { id: credentialId, userId },
      data,
    });
  }

  delete(credentialId: string, userId: string) {
    return this.prisma.credential.delete({
      where: { id: credentialId, userId },
    });
  }
}
