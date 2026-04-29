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
    lockoutDurationMinutes: env
      .get('LOCKOUT_DURATION_MINUTES')
      .required()
      .asIntPositive(),
    emailCodeTtlMinutes: env
      .get('AUTH_EMAIL_CODE_TTL_MINUTES')
      .required()
      .asIntPositive(),
    emailCodeMaxAttempts: env
      .get('AUTH_EMAIL_CODE_MAX_ATTEMPTS')
      .required()
      .asIntPositive(),
    emailChangeCooldownDays: env
      .get('AUTH_EMAIL_CHANGE_COOLDOWN_DAYS')
      .required()
      .asInt(),
  },
  groups: {
    maxLengthGroup: env.get('MAX_LENGTH_GROUP').required().asIntPositive(),
  },
  redis: {
    host: env.get('REDIS_HOST').required().asString(),
    port: env.get('REDIS_PORT').required().asPortNumber(),
    password: env.get('REDIS_PASSWORD').asString(),
    sessionTtlSeconds: env.get('REDIS_SESSION_TTL_SECONDS').asIntPositive(),
  },
  mail: {
    host: env.get('MAIL_HOST').required().asString(),
    port: env.get('MAIL_PORT').required().asPortNumber(),
    user: env.get('MAIL_USER').required().asString(),
    password: env.get('MAIL_PASSWORD').required().asString(),
    from: env.get('MAIL_FROM').required().asString(),
  },
});

export type AppConfig = ReturnType<typeof configuration>;
