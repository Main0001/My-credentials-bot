import { Markup } from 'telegraf';

export const credentialsMenuKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('Add ➕', 'credential_add'),
      Markup.button.callback('Edit ✏️', 'credential_edit'),
    ],
    [Markup.button.callback('Delete 🗑️', 'credential_delete')],
    [
      Markup.button.callback('View all 👁️', 'credential_view_all'),
      Markup.button.callback('View by group 📁', 'credential_view_by_group'),
    ],
    [Markup.button.callback('View without group 📄', 'credential_view_no_group')],
    [Markup.button.callback('Back ↩️', 'back_to_main')],
  ]);
