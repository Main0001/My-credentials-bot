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
};
