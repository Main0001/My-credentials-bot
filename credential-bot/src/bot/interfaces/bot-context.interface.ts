import { Context, Scenes } from 'telegraf';
import { UserModel } from '../../../generated/prisma/models/User';

export interface BotSession extends Scenes.WizardSession {
  messageIds: number[];
}

export interface WizardState {
  password?: string;
  attempts?: number;
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext> & { state: WizardState };
  state: { user?: UserModel };
}
