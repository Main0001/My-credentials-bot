# Credential Bot

Telegram-bot for securely storing and managing credentials (logins/passwords), organized by groups.

## Tech Stack

- **Framework:** NestJS
- **Bot:** Telegraf + nestjs-telegraf
- **Database:** PostgreSQL + Prisma (PrismaPg adapter)
- **Security:** bcrypt (password hashing), AES-256-GCM (credential encryption)
- **Other:** dayjs, env-var, class-validator

## Features

- Master password authentication with session timeout
- Password setup, login, and account reset
- Groups CRUD (create, view, edit, delete)
- Credentials CRUD (add, view all / by group / without group, edit, delete)
- AES-256-GCM encryption for stored passwords
- Automatic message cleanup for sensitive data

## Project Structure

```
src/
  config/           — environment configuration
  prisma/           — PrismaService + PrismaModule
  users/            — User repository + service
  groups/           — Group repository + service
  credentials/      — Credential repository + service + interfaces
  bot/
    constants/      — scene names, callback actions, commands (enums)
    messages/       — all user-facing text strings (i18n-ready)
    keyboards/      — reply and inline keyboards
    guards/         — auth guard (session validation + timeout)
    helpers/        — CryptoHelper (AES-256-GCM), MessageCleaner
    interfaces/     — BotContext interface
    scenes/
      auth/         — setup-password, enter-password, reset-password
      groups/       — create, view, edit, delete group
      credentials/  — add, view-all, view-by-group, view-without-group, edit, delete credential
```

## Prerequisites

- Node.js >= 20
- PostgreSQL

## Setup

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/credbot"
TELEGRAM_BOT_TOKEN="your-bot-token"
ENCRYPTION_KEY="64-char-hex-string"
ENCRYPTION_ALGORITHM="aes-256-gcm"
ENCRYPTION_IV_LENGTH=12
INACTIVITY_TIMEOUT_HOURS=3
SALT_FOR_HASH=10
MAX_LOGIN_ATTEMPTS=3
MAX_CONFIRM_ATTEMPTS=3
MAX_LENGTH_GROUP=50
```

4. Run database migrations:
```bash
npm run deploy:migrate
```

5. Start the bot:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Scripts

| Script | Description |
|---|---|
| `npm run build` | Generate Prisma client + compile |
| `npm run start:dev` | Start in watch mode |
| `npm run start:prod` | Start production build |
| `npm run deploy:migrate` | Apply database migrations |
