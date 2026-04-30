import { resolveMx } from 'node:dns/promises';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(s: string): boolean {
  return EMAIL_REGEX.test(s);
}

export async function hasMxRecord(email: string): Promise<boolean> {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const records = await (domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return `${local[0]}***@${domain}`;
}