import { BotCommand } from 'telegraf/types';

export const BOT_COMMANDS: BotCommand[] = [
  { command: 'start', description: 'Start the bot' },
  { command: 'menu', description: 'Open main menu' },
  { command: 'cancel', description: 'Cancel current operation' },
  { command: 'skip', description: 'Skip optional step' },
];
