import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, name: string) {
    return this.prisma.group.create({
      data: { userId, name },
    });
  }

  findAllByUser(userId: string) {
    return this.prisma.group.findMany({ where: { userId } });
  }

  findOne(groupId: string, userId: string) {
    return this.prisma.group.findFirst({ where: { id: groupId, userId } });
  }

  update(groupId: string, userId: string, name: string) {
    return this.prisma.group.update({
      where: { id: groupId, userId },
      data: { name },
    });
  }

  delete(groupId: string, userId: string) {
    return this.prisma.group.delete({ where: { id: groupId, userId } });
  }
}
