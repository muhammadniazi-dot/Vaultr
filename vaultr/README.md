# Vaultr

A Wealthsimple-style mobile banking app built as a portfolio project — dark-themed accounts,
transaction history, savings goals, and an AI financial assistant powered by Claude.

![React Native](https://img.shields.io/badge/React_Native-0.76-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ECF8E?logo=supabase&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Claude](https://img.shields.io/badge/AI-Claude_API-c9a84c)

## Tech stack
- **Mobile**: React Native + Expo, Expo Router
- **Backend**: Node.js + Express, deployed on Render
- **Database**: PostgreSQL via Supabase, accessed through Prisma ORM
- **Auth**: JWT + bcrypt, tokens in Expo Secure Store
- **Biometric**: Expo Local Authentication (Face ID)
- **Charts**: Victory Native
- **AI**: Claude API (`claude-sonnet-4-6`)

See [CLAUDE.md](./CLAUDE.md) for full project context, design tokens, schema, and API routes.

## Getting started

```bash
# Frontend
cd frontend
npm install
npx expo start

# Backend
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, CLAUDE_API_KEY
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```
