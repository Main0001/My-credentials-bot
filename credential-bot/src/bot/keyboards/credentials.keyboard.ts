import { Markup } from 'telegraf';
import { CallbackAction } from '../constants/actions.enum';

export const credentialsMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Add ➕', CallbackAction.CREDENTIAL_ADD),
      Markup.button.callback('Edit ✏️', CallbackAction.CREDENTIAL_EDIT),
    ],
    [Markup.button.callback('Delete 🗑️', CallbackAction.CREDENTIAL_DELETE)],
    [
      Markup.button.callback('View all 👁️', CallbackAction.CREDENTIAL_VIEW_ALL),
      Markup.button.callback('View by group 📁', CallbackAction.CREDENTIAL_VIEW_BY_GROUP),
    ],
    [Markup.button.callback('View without group 📄', CallbackAction.CREDENTIAL_VIEW_NO_GROUP)],
    [Markup.button.callback('Back ↩️', CallbackAction.BACK_TO_MAIN)],
  ]);
