import { Markup } from 'telegraf';
import { CallbackAction } from '@/bot/constants/actions.enum';
import { KEYBOARDS } from '@/bot/messages/keyboards.messages';

export const groupsMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback(KEYBOARDS.CREATE_GROUP, CallbackAction.GROUP_CREATE),
      Markup.button.callback(KEYBOARDS.EDIT_GROUP, CallbackAction.GROUP_EDIT),
    ],
    [Markup.button.callback(KEYBOARDS.VIEW_GROUPS, CallbackAction.GROUP_VIEW)],
    [Markup.button.callback(KEYBOARDS.DELETE_GROUP, CallbackAction.GROUP_DELETE)],
    [Markup.button.callback(KEYBOARDS.BACK, CallbackAction.BACK_TO_MAIN)],
  ]);
