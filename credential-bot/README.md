# Credential Bot
 
Telegram-bot for securely storing and managing credentials (logins/passwords), organized by groups.

## Tech Stack

- **Framework:** NestJS
- **Bot:** Telegraf + nestjs-telegraf
- **Database:** PostgreSQL + Prisma (PrismaPg adapter)
- **Session storage:** Redis (persistent, survives restarts)
- **Scheduling:** @nestjs/schedule (inactivity cleanup cron)
- **Security:** bcrypt (password hashing), AES-256-GCM (credential encryption)
- **Logging:** NestJS Logger (auth events, business operations, infra errors)
- **Other:** dayjs, env-var, class-validator

## Features

- Master password authentication with session timeout
- Brute-force protection with lockout after N failed attempts
- Password setup, login, and account reset
- Groups CRUD (create, view, edit, delete)
- Credentials CRUD (add, view all / by group / without group, edit, delete)
- AES-256-GCM encryption for stored passwords
- Automatic message cleanup for sensitive data (in-scene and on inactivity)
- Redis-backed sessions: user wizard state persists across bot restarts
- Scheduled inactivity cleanup: deletes chat messages for users idle > N hours

## Project Structure

```
src/
  config/             — environment configuration
  prisma/             — PrismaService + PrismaModule
  redis/              — RedisService + RedisModule (global)
  users/              — User repository + service
  groups/             — Group repository + service
  credentials/        — Credential repository + service + interfaces
  bot/
    constants/        — scene names, callback actions, commands (enums)
    messages/         — all user-facing text strings (i18n-ready)
    keyboards/        — reply and inline keyboards
    guards/           — auth guard (session validation + timeout)
    helpers/          — CryptoHelper (AES-256-GCM), MessageCleaner
    interfaces/       — BotContext interface
    middleware/       — trackMessageIdMiddleware (auto-tracks incoming msg ids)
    session/          — RedisSessionStore (Telegraf SessionStore adapter)
    cleanup/          — InactivityCleanupService (cron)
    scenes/
      auth/           — setup-password, enter-password, reset-password, logout
      groups/         — create, view, edit, delete
      credentials/    — add, view-all, view-by-group, view-without-group, edit, delete
```

## Prerequisites

- Node.js >= 20
- Docker + Docker Compose (for Postgres and Redis)

## Setup

1. Clone the repository.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` file (see [Environment Variables](#environment-variables) below).

4. Start infrastructure (Postgres + Redis):

   ```bash
   docker compose up -d
   ```

5. Apply database migrations:

   ```bash
   npx prisma migrate deploy
   ```

6. Start the bot:

   ```bash
   # Development (watch mode)
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## Environment Variables

```env
# Database (Postgres runs in docker-compose on host port 5433)
DATABASE_URL="postgresql://user:password@localhost:5433/credbot"

# Telegram
TELEGRAM_BOT_TOKEN="your-bot-token"

# Encryption
ENCRYPTION_KEY="64-char-hex-string"
ENCRYPTION_ALGORITHM="aes-256-gcm"
ENCRYPTION_IV_LENGTH=12

# Auth
INACTIVITY_TIMEOUT_HOURS=3
SALT_FOR_HASH=10
MAX_LOGIN_ATTEMPTS=3
LOCKOUT_DURATION_MINUTES=5
MAX_CONFIRM_ATTEMPTS=3

# Groups
MAX_LENGTH_GROUP=50

# Redis
REDIS_HOST=HOST
REDIS_PORT=PORT
REDIS_PASSWORD=PASSWORD
REDIS_SESSION_TTL_SECONDS=86400
```

| Variable                    | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `DATABASE_URL`              | Postgres connection string                       |
| `TELEGRAM_BOT_TOKEN`        | Bot token from @BotFather                        |
| `ENCRYPTION_KEY`            | 32-byte (64 hex chars) key for AES-256-GCM       |
| `INACTIVITY_TIMEOUT_HOURS`  | Re-auth + chat cleanup after N hours idle        |
| `MAX_LOGIN_ATTEMPTS`        | Failed attempts before lockout                   |
| `LOCKOUT_DURATION_MINUTES`  | Lockout duration after too many failures         |
| `MAX_CONFIRM_ATTEMPTS`      | Password confirmation attempts during setup      |
| `MAX_LENGTH_GROUP`          | Maximum group name length                        |
| `REDIS_PASSWORD`            | Leave empty for no-auth (docker-compose default) |
| `REDIS_SESSION_TTL_SECONDS` | Session key TTL; refreshed on every user action  |

## Scripts

| Script                   | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `npm run build`          | Install prod deps + generate Prisma client + compile |
| `npm run start:dev`      | Start in watch mode                                  |
| `npm run start:prod`     | Start production build                               |
| `npm run deploy:migrate` | Apply database migrations                            |
