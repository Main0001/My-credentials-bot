import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoHelper {
  private readonly key: Buffer;
  private readonly algorithm: string;
  private readonly ivLength: number;

  constructor(configService: ConfigService) {
    this.key = Buffer.from(configService.get<string>('encryption.key')!, 'hex');
    this.algorithm = configService.get<string>('encryption.algorithm')!;
    this.ivLength = configService.get<number>('encryption.ivLength')!;
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    return `${decipher.update(encrypted)}${decipher.final('utf8')}`;
  }
}
