import { Markup } from 'telegraf';

export const mainKeyboard = () =>
  Markup.keyboard([['Groups', 'Credentials'], ['Reset password']]).resize();
