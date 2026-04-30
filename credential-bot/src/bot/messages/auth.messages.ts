export const AUTH = {
  WELCOME: (name: string) => `Hello, ${name}! Welcome to Credential Bot 👋`,
  ENTER_PASSWORD: '🔐 Please enter your password:',
  ACCESS_GRANTED: '✅ Access granted!',
  TOO_MANY_ATTEMPTS: '🚫 Too many failed attempts. Please try again later.',
  LOCKED_OUT: (minutes: number) =>
    `🚫 Too many failed attempts. Try again in ${minutes} minute(s).`,
  WRONG_PASSWORD: (remaining: number) =>
    `❌ Wrong password. Attempts remaining: ${remaining}`,

  SETUP_PROMPT: '🔐 Welcome! Please create a password for the bot:\n\nSend /cancel to abort.',
  SETUP_CANCELLED: 'Password setup cancelled ❌. Send /start to begin again.',
  PASSWORD_TOO_SHORT: '⚠️ Password must be at least 6 characters. Try again:',
  CONFIRM_PASSWORD: '🔁 Confirm your password:',
  PASSWORDS_NOT_MATCH: (remaining: number) =>
    `❌ Passwords do not match. Try again (${remaining} attempts left):`,
  SETUP_TOO_MANY_ATTEMPTS: '🚫 Too many failed attempts. Send /start to try again.',
  PASSWORD_SET: '✅ Password set successfully!',

  RESET_CONFIRM_PROMPT: '⚠️ This will delete your account and all data (groups, credentials). Are you sure?\n\nSend /cancel to abort.',
  RESET_CANCELLED: '↩️ Reset cancelled.',

  LOGOUT_CONFIRM_PROMPT: '🚪 Are you sure you want to logout?\n\nSend /cancel to abort.',
  LOGOUT_SUCCESS: '🚪 Logged out successfully. Enter your password to continue.',
  LOGOUT_CANCELLED: '↩️ Logout cancelled.',

  ENTER_EMAIL: '📧 Please enter your email:',
  INVALID_EMAIL: '⚠️ Invalid email format. Try again:',
  INVALID_EMAIL_DOMAIN:
    "⚠️ This email domain doesn't accept mail. Check the spelling and try again:",
  EMAIL_TAKEN: '⚠️ This email is already registered. Try another:',
  EMAIL_SAME_AS_CURRENT: '⚠️ This is already your current email.',

  CODE_SENT: (masked: string) =>
    `📧 We sent a verification code to ${masked}.\nPlease enter the 6-digit code:`,
  WRONG_CODE: (remaining: number) =>
    `❌ Wrong code. Attempts remaining: ${remaining}`,
  CODE_EXPIRED: '⏰ Code expired. Please start over.',
  TOO_MANY_CODE_ATTEMPTS: '🚫 Too many failed attempts. Please start over.',
  CODE_RESENT: '📧 New code sent.',
  EMAIL_VERIFIED: '✅ Email verified!',

  EMAIL_CHANGE_SCHEDULED: (date: string) =>
    `✅ Email change scheduled. New email will become active on ${date}.\n` +
    `You can cancel any time before that via /menu → Change email → Cancel.`,
  EMAIL_CHANGE_PENDING: (masked: string, date: string) =>
    `⏳ Email change to ${masked} is scheduled for ${date}.`,
  EMAIL_CHANGE_CANCELLED: '✅ Pending email change cancelled.',
  EMAIL_CHANGE_APPLIED: (newEmail: string) =>
    `✅ Email changed to ${newEmail}.`,
  EMAIL_CHANGE_CONFLICT: (email: string) =>
    `❌ Email change failed: ${email} is no longer available. Pending change cancelled.`,
};
