import { Markup } from 'telegraf';
import { CallbackAction } from '../constants/actions.enum';

export const groupsMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Create group ➕', CallbackAction.GROUP_CREATE),
      Markup.button.callback('Edit group ✏️', CallbackAction.GROUP_EDIT),
    ],
    [Markup.button.callback('View groups 👁️', CallbackAction.GROUP_VIEW)],
    [Markup.button.callback('Delete group 🗑️', CallbackAction.GROUP_DELETE)],
    [Markup.button.callback('Back ↩️', CallbackAction.BACK_TO_MAIN)],
  ]);
