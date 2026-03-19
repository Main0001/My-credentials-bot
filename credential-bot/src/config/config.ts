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
  },
});

export type AppConfig = ReturnType<typeof configuration>;
