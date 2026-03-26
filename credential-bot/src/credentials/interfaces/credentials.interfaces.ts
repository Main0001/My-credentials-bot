export interface CreateCredentialData {
  title?: string;
  login: string;
  password: string;
  groupId?: string;
}

export interface UpdateCredentialData {
  title?: string;
  login?: string;
  password?: string;
  groupId?: string | null;
}
