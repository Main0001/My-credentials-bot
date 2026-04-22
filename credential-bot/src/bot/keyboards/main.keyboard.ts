import { Markup } from 'telegraf';
import { CallbackAction } from '../constants/actions.enum';
import { KEYBOARDS } from '../messages/keyboards.messages';

export const mainKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(KEYBOARDS.GROUPS, CallbackAction.MAIN_GROUPS),
      Markup.button.callback(KEYBOARDS.CREDENTIALS, CallbackAction.MAIN_CREDENTIALS),
    ],
    [
      Markup.button.callback(KEYBOARDS.RESET_PASSWORD, CallbackAction.MAIN_RESET_PASSWORD),
      Markup.button.callback(KEYBOARDS.LOGOUT, CallbackAction.MAIN_LOGOUT),
    ],
  ]);
