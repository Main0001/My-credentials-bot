export const GROUPS = {
  MENU: 'Groups menu 📁:',
  NO_GROUPS: 'ℹ️ You have no groups.',

  CREATE_PROMPT: '📝 Enter group name:\n\nSend /cancel to abort.',
  NAME_TOO_LONG: (max: number) =>
    `⚠️ Name is too long (max ${max} characters). Try again:`,
  CREATED: (name: string) => `✅ Group "${name}" created!`,

  SELECT_TO_EDIT: '✏️ Select group to edit:',
  ENTER_NEW_NAME: '📝 Enter new group name:',
  RENAMED: (name: string) => `✅ Group renamed to "${name}"!`,

  SELECT_TO_DELETE: '🗑️ Select group to delete:',
  DELETE_CONFIRM: '⚠️ Are you sure? Credentials in this group will be ungrouped.',
  DELETED: '✅ Group deleted!',

  LIST: (list: string) => `📁 Your groups:\n\n${list}`,
};
