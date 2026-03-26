import { Module } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
import { CredentialsService } from './credentials.service';

@Module({
  providers: [CredentialsRepository, CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
