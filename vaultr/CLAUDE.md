# Vaultr

## Project description
Vaultr is a Wealthsimple-style mobile banking app built as a portfolio project. It simulates a
personal banking experience: multiple accounts (savings, chequing, TFSA), transaction history,
savings goals with progress tracking, balance charts, and an AI financial assistant powered by
the Claude API. The app is dark-themed ("Obsidian") and targets a native, production-feeling
mobile UX via Expo.

## Tech stack
- **Mobile**: React Native + Expo (Expo Router for file-based navigation), tested live via Expo Go
- **Backend**: Node.js + Express, deployed on Render
- **Database**: PostgreSQL via Supabase, accessed through Prisma ORM
- **Auth**: JWT (jsonwebtoken) with bcrypt password hashing; tokens stored in Expo Secure Store
- **Biometric**: Expo Local Authentication (Face ID)
- **Charts**: Victory Native
- **Notifications**: Expo Push Notifications
- **AI**: Claude API (`claude-sonnet-4-6`) called from the backend, never directly from the client
- **Version control**: GitHub

## Design system — Obsidian dark theme
All tokens live in `frontend/constants/theme.ts`. Never hardcode colors/spacing in components.

| Token | Value |
|---|---|
| Background | `#0f0f0f` |
| Surface | `#1a1a1a` |
| Card | `#242424` |
| Border | `#2a2a2a` |
| Accent gold | `#c9a84c` |
| Positive amounts | `#c9a84c` |
| Negative amounts | `#888888` |
| Text primary | `#e0e0e0` |
| Text muted | `#555555` |
| Danger | `#f87171` |

- Font: System default (SF Pro on iOS)
- Card border radius: 14px
- Button border radius: 10px
- No gradients anywhere
- Generous padding: 16-20px on screens, 14px inside cards

## Folder structure
```
vaultr/
├── frontend/
│   ├── app/
│   │   ├── (auth)/          # login, signup — unauthenticated stack
│   │   ├── (tabs)/          # home, activity, goals, profile — authenticated tab bar
│   │   └── chat.tsx         # AI assistant, presented modally
│   ├── components/          # Reusable presentational components
│   ├── constants/theme.ts   # All design tokens
│   ├── hooks/                # useAuth, useTransactions
│   ├── services/              # api.ts (axios), auth.ts, claude.ts
│   └── types/index.ts       # Shared TypeScript interfaces
├── backend/
│   ├── src/
│   │   ├── routes/           # auth, accounts, transactions, goals, assistant
│   │   ├── middleware/verifyToken.ts
│   │   ├── prisma/schema.prisma
│   │   └── index.ts          # Express entry point
│   └── .env.example
└── README.md
```

## Coding conventions
- TypeScript strict mode everywhere (both frontend and backend `tsconfig.json` have `strict: true`)
- Use `async/await`, never raw `.then()` chains
- No inline styles — all colors, spacing, and radii come from `constants/theme.ts`
- Components are functional with hooks; no class components
- Backend routes are thin — validation and DB access inline in the route handler is fine at this
  scale, but keep Prisma calls scoped to the authenticated `userId`
- The Claude API key never ships to the client; `frontend/services/claude.ts` calls the backend's
  `/assistant` routes, which proxy to Anthropic

## Database schema (Prisma)
- **User**: `id, email, passwordHash, name, avatarUrl, createdAt` — has many Accounts, Transactions, Goals
- **Account**: `id, userId, type (SAVINGS | CHEQUING | TFSA), balance, name, accountNumberLast4, currency (default CAD), institutionName (default "Vaultr"), createdAt, updatedAt` — belongs to User
- **Transaction**: `id, accountId, userId, amount, type (CREDIT | DEBIT), status (PENDING | COMPLETED | FAILED, default COMPLETED), category, merchantName, description, recipient, currency (default CAD), createdAt, updatedAt` — belongs to Account and User
- **Goal**: `id, userId, name, targetAmount, currentAmount, linkedAccountId, deadline, createdAt` — belongs to User, optionally linked to an Account

## API routes
All routes except `/health`, `/auth/signup`, `/auth/login` require a `Bearer` JWT and are scoped
to the authenticated user.

- `GET /health`
- `POST /auth/signup` — body: `{ email, password, name }`
- `POST /auth/login` — body: `{ email, password }`
- `GET /accounts` — returns the user's accounts, shaped with `balance`, `availableBalance`, `accountNumberLast4`, `currency`, `institutionName`
- `POST /accounts` — body: `{ type, name, balance? }`
- `GET /accounts/:id`
- `GET /transactions?accountId=&limit=&offset=&type=&status=` — sorted newest first. `type` accepts `credit`/`debit` or the friendlier `deposit`/`withdrawal`/`transfer`/`payment`; `status` accepts `pending`/`completed`/`failed`
- `POST /transactions` — body: `{ accountId, type, amount, title|merchantName, description?, category?, recipient? }`. Validates a positive amount and account ownership, atomically updates the account balance (credit adds, debit subtracts), rejects if the result would go negative, and returns `{ transaction, account }`
- `GET /goals`
- `POST /goals` — body: `{ name, targetAmount, currentAmount?, linkedAccountId?, deadline? }`
- `PATCH /goals/:id`
- `POST /assistant/chat` — body: `{ message }`, proxies to Claude
- `GET /assistant/history`
