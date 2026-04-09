import { Markup } from 'telegraf';
import { KEYBOARDS } from '../messages/keyboards.messages';

export const mainKeyboard = () =>
  Markup.keyboard([
    [KEYBOARDS.GROUPS, KEYBOARDS.CREDENTIALS],
    [KEYBOARDS.RESET_PASSWORD, KEYBOARDS.LOGOUT],
  ]).resize();
