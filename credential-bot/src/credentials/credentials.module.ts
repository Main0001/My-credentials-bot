import { Module } from '@nestjs/common';
import { CredentialsRepository } from './credentials.repository';
import { CredentialsService } from './credentials.service';
import { CryptoHelper } from '@/bot/helpers/crypto.helper';

@Module({
  providers: [CredentialsRepository, CredentialsService, CryptoHelper],
  exports: [CredentialsService, CryptoHelper],
})
export class CredentialsModule {}
