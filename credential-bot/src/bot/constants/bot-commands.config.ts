import { BotCommand } from 'telegraf/types';

export const BOT_COMMANDS: BotCommand[] = [
  { command: 'start', description: 'Start the bot' },
  { command: 'cancel', description: 'Cancel current operation' },
  { command: 'skip', description: 'Skip optional step' },
];
