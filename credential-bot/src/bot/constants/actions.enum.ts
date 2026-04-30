export enum CallbackAction {
  // Main menu
  BACK_TO_MAIN = 'back_to_main',
  MAIN_GROUPS = 'main_groups',
  MAIN_CREDENTIALS = 'main_credentials',
  MAIN_CHANGE_EMAIL = 'main_change_email',
  MAIN_RESET_PASSWORD = 'main_reset_password',
  MAIN_LOGOUT = 'main_logout',

  // Groups menu
  GROUP_CREATE = 'group_create',
  GROUP_VIEW = 'group_view',
  GROUP_EDIT = 'group_edit',
  GROUP_DELETE = 'group_delete',

  // Credentials menu
  CREDENTIAL_ADD = 'credential_add',
  CREDENTIAL_VIEW_ALL = 'credential_view_all',
  CREDENTIAL_VIEW_BY_GROUP = 'credential_view_by_group',
  CREDENTIAL_VIEW_NO_GROUP = 'credential_view_no_group',
  CREDENTIAL_EDIT = 'credential_edit',
  CREDENTIAL_DELETE = 'credential_delete',

  // Auth scenes
  ENTER_PW_RESET = 'enter_pw_reset',
  RESET_CONFIRM = 'reset_confirm',
  RESET_CANCEL = 'reset_cancel',
  LOGOUT_CONFIRM = 'logout_confirm',
  LOGOUT_CANCEL = 'logout_cancel',

  // Email verification (resend code in different flows)
  RESEND_SETUP_CODE = 'resend_setup_code',
  RESEND_RESET_CODE = 'resend_reset_code',
  RESEND_EMAIL_CHANGE_CODE = 'resend_email_change_code',

  // Change email scene
  EMAIL_CHANGE_CANCEL = 'email_change_cancel',

  // Delete group scene
  DEL_GROUP_CONFIRM = 'del_group_confirm',
  DEL_GROUP_CANCEL = 'del_group_cancel',

  // Edit group scene
  EDIT_GROUP_CANCEL = 'edit_group_cancel',

  // View groups scene
  VIEW_GROUPS_BACK = 'view_groups_back',

  // Add credential scene
  ADD_CRED_NO_GROUP = 'add_cred_no_group',

  // Edit credential scene
  EDIT_CRED_CANCEL = 'edit_cred_cancel',
  EDIT_CRED_SRC_NONE = 'edit_cred_src_none',
  EDIT_CRED_FIELD_TITLE = 'edit_cred_field_title',
  EDIT_CRED_FIELD_LOGIN = 'edit_cred_field_login',
  EDIT_CRED_FIELD_PASSWORD = 'edit_cred_field_password',

  // Delete credential scene
  DEL_CRED_CANCEL = 'del_cred_cancel',
  DEL_CRED_CONFIRM = 'del_cred_confirm',
  DEL_CRED_SRC_NONE = 'del_cred_src_none',

  // View credentials scenes
  VIEW_ALL_CRED_BACK = 'view_all_cred_back',
  VBG_NO_GROUP = 'vbg_no_group',
  VBG_CANCEL = 'vbg_cancel',
  VBG_BACK = 'vbg_back',
  VWG_BACK = 'vwg_back',
}

/** Prefixes for dynamic callback actions (with entity ID appended) */
export enum ActionPrefix {
  DEL_GROUP = 'del_group_',
  EDIT_GROUP = 'edit_group_',
  ADD_CRED_GROUP = 'add_cred_group_',
  EDIT_CRED_SRC = 'edit_cred_src_',
  EDIT_CRED = 'edit_cred_',
  EDIT_CRED_FIELD = 'edit_cred_field_',
  DEL_CRED_SRC = 'del_cred_src_',
  DEL_CRED = 'del_cred_',
  VBG = 'vbg_',
}
