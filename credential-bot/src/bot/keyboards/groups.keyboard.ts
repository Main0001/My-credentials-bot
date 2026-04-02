import { Markup } from 'telegraf';

export const groupsMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Create group ➕', 'group_create'),
      Markup.button.callback('Edit group ✏️', 'group_edit'),
    ],
    [Markup.button.callback('View groups 👁️', 'group_view')],
    [Markup.button.callback('Delete group 🗑️', 'group_delete')],
    [Markup.button.callback('Back ↩️', 'back_to_main')],
  ]);
