export const formatCredentialLine = (
  title: string | null,
  login: string,
  password: string,
): string => {
  const titlePart = title ? `${title} — ` : '';
  return `${titlePart}<code>${login}</code> : <tg-spoiler>${password}</tg-spoiler>`;
};

export const CREDENTIALS = {
  MENU: 'Credentials menu 🔑:',
  NO_CREDENTIALS: 'ℹ️ You have no credentials.',
  NO_CREDENTIALS_FOUND: 'ℹ️ No credentials found.',
  NO_CREDENTIALS_IN_GROUP: 'ℹ️ No credentials in this group.',
  NO_CREDENTIALS_WITHOUT_GROUP: 'ℹ️ No credentials without group.',

  ADD_TITLE_PROMPT: '📝 Enter credential title (or send /skip to skip):\n\nSend /cancel to abort.',
  ENTER_LOGIN: '🔤 Enter login:\n\nSend /cancel to abort.',
  ENTER_PASSWORD: '🔑 Enter password:\n\nSend /cancel to abort.',
  SELECT_GROUP: '📁 Select group:\n\nSend /cancel to abort.',
  SELECT_GROUP_OR_NONE: '📁 Select group or "Without group":\n\nSend /cancel to abort.',
  ADDED: '✅ Credential added!',

  SELECT_TO_EDIT: '✏️ Select credential to edit:\n\nSend /cancel to abort.',
  CURRENT_CREDENTIAL: (line: string) => `📋 Current data:\n${line}\n\n✏️ What do you want to edit?\n\nSend /cancel to abort.`,
  ENTER_NEW_FIELD: (field: string) => `📝 Enter new ${field}:\n\nSend /cancel to abort.`,
  ENTER_TEXT_FIELD: (field: string) => `Please enter a text ${field}:`,
  FIELD_UPDATED: (field: string, line: string) =>
    `✅ ${field} updated!\n\n📋 Current data:\n${line}\n\n✏️ What do you want to edit?\n\nSend /cancel to abort.`,

  SELECT_TO_DELETE: '🗑️ Select credential to delete:\n\nSend /cancel to abort.',
  DELETE_CONFIRM: '⚠️ Are you sure you want to delete this credential?\n\nSend /cancel to abort.',
  DELETED: '✅ Credential deleted!',

  LIST_ALL: (list: string) => `🔑 Your credentials:\n\n${list}`,
  LIST_BY_GROUP: (list: string) => `🔑 Credentials in group:\n\n${list}`,
  LIST_WITHOUT_GROUP: (list: string) => `📄 Credentials without group:\n\n${list}`,
};
