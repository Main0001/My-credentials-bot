import { Markup } from 'telegraf';
import { CallbackAction } from '../constants/actions.enum';
import { KEYBOARDS } from '../messages/keyboards.messages';

export const credentialsMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(KEYBOARDS.ADD, CallbackAction.CREDENTIAL_ADD),
      Markup.button.callback(KEYBOARDS.EDIT, CallbackAction.CREDENTIAL_EDIT),
    ],
    [Markup.button.callback(KEYBOARDS.DELETE, CallbackAction.CREDENTIAL_DELETE)],
    [
      Markup.button.callback(KEYBOARDS.VIEW_ALL, CallbackAction.CREDENTIAL_VIEW_ALL),
      Markup.button.callback(KEYBOARDS.VIEW_BY_GROUP, CallbackAction.CREDENTIAL_VIEW_BY_GROUP),
    ],
    [Markup.button.callback(KEYBOARDS.VIEW_WITHOUT_GROUP, CallbackAction.CREDENTIAL_VIEW_NO_GROUP)],
    [Markup.button.callback(KEYBOARDS.BACK, CallbackAction.BACK_TO_MAIN)],
  ]);
