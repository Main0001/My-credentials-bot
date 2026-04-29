import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

export type MailPurpose = 'setup' | 'reset' | 'email_change';

const SUBJECTS: Record<MailPurpose, string> = {
  setup: 'Verify your Credential Bot email',
  reset: 'Credential Bot — password reset code',
  email_change: 'Credential Bot — email change confirmation',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly codeTtlMinutes: number;

  constructor(
    private readonly mailer: MailerService,
    configService: ConfigService,
  ) {
    this.codeTtlMinutes = configService.get<number>(
      'auth.emailCodeTtlMinutes',
    )!;
  }

  async sendVerificationCode(
    email: string,
    code: string,
    purpose: MailPurpose,
  ): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: email,
        subject: SUBJECTS[purpose],
        text: `Your verification code: ${code}\n\nIt expires in ${this.codeTtlMinutes} minutes.`,
      });
      this.logger.log(`Code sent: purpose=${purpose}, to=${email}`);
    } catch (err) {
      this.logger.error(
        `Send code failed: purpose=${purpose}, to=${email}, error=${(err as Error).message}`,
      );
      throw err;
    }
  }

  async sendEmailChangeNotice(
    oldEmail: string,
    newEmail: string,
    scheduledAt: Date,
  ): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: oldEmail,
        subject: 'Email change scheduled for your Credential Bot account',
        text: [
          `A change to ${newEmail} was just scheduled.`,
          `It will apply on ${scheduledAt.toISOString()}.`,
          `If this wasn't you — open the bot and tap "Cancel pending change".`,
        ].join('\n\n'),
      });
      this.logger.log(
        `Change notice sent: oldEmail=${oldEmail}, newEmail=${newEmail}`,
      );
    } catch (err) {
      this.logger.error(
        `Send change notice failed: oldEmail=${oldEmail}, error=${(err as Error).message}`,
      );
      throw err;
    }
  }
}
