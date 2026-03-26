import * as env from 'env-var';

export const configuration = () => ({
  telegram: {
    token: env.get('TELEGRAM_BOT_TOKEN').required().asString(),
  },
  database: {
    url: env.get('DATABASE_URL').required().asUrlString(),
  },
  encryption: {
    key: env.get('ENCRYPTION_KEY').required().asString(),
    algorithm: env.get('ENCRYPTION_ALGORITHM').required().asString(),
    ivLength: env.get('ENCRYPTION_IV_LENGTH').required().asIntPositive(),
  },
  auth: {
    inactivityTimeoutHours: env
      .get('INACTIVITY_TIMEOUT_HOURS')
      .required()
      .asIntPositive(),
    saltForHash: env.get('SALT_FOR_HASH').required().asIntPositive(),
    maxLoginAttempts: env.get('MAX_LOGIN_ATTEMPTS').required().asIntPositive(),
    maxConfirmAttempts: env
      .get('MAX_CONFIRM_ATTEMPTS')
      .required()
      .asIntPositive(),
  },
});

export type AppConfig = ReturnType<typeof configuration>;
