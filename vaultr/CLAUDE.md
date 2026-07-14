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
- **User**: `id, email, passwordHash, name, avatarUrl, emailVerified (default false), createdAt` — has many Accounts, Transactions, Goals, EmailVerifications
- **EmailVerification**: `id, userId, codeHash (bcrypt of the 6-digit code), expiresAt, consumedAt, createdAt` — single-use, expiring verification codes; plaintext codes are never stored
- **Account**: `id, userId, type (SAVINGS | CHEQUING | TFSA | CREDIT_CARD), balance, creditLimit, name, accountNumberLast4, currency (default CAD), institutionName (default "Vaultr"), createdAt, updatedAt` — belongs to User. `creditLimit` is only set for CREDIT_CARD accounts; for those, `balance` represents the amount currently owed rather than a saved amount
- **Transaction**: `id, accountId, userId, amount, type (CREDIT | DEBIT), status (PENDING | COMPLETED | FAILED, default COMPLETED), category, merchantName, description, recipient, currency (default CAD), createdAt, updatedAt` — belongs to Account and User
- **Goal**: `id, userId, name, targetAmount, currentAmount, linkedAccountId, monthlyContribution, deadline, createdAt` — belongs to User, optionally linked to an Account. `monthlyContribution` is optional and only used by the frontend to project a completion date; not enforced server-side.

## API routes
All routes except `/health`, `/auth/signup`, `/auth/login` require a `Bearer` JWT and are scoped
to the authenticated user.

- `GET /health`
- `POST /auth/signup` — body: `{ email, password, name }`. Creates the user (unverified) and sends a verification code email
- `POST /auth/login` — body: `{ email, password }`
- `POST /auth/change-password` — body: `{ currentPassword, newPassword }`. Auth required. Verifies the current password, rejects reuse, min 8 chars. Returns `{ ok: true }`
- `POST /auth/send-verification-email` — auth required, sends a fresh 6-digit code to the user's email
- `POST /auth/verify-email` — body: `{ code }`, auth required. Marks `emailVerified` on success, returns `{ user }`
- `POST /auth/resend-verification-email` — auth required, rate-limited resend of the code
- `GET /accounts` — returns the user's accounts, shaped with `balance`, `availableBalance`, `accountNumberLast4`, `currency`, `institutionName`
- `POST /accounts` — body: `{ type, name?, balance?, creditLimit? }`. Validates `type` is one of `CHEQUING`/`SAVINGS`/`TFSA`/`CREDIT_CARD`; `name` defaults to a sensible name per type if omitted; `creditLimit` defaults to $2000 for `CREDIT_CARD` (ignored otherwise); generates a globally-unique `accountNumberLast4`
- `GET /accounts/:id`
- `GET /transactions?accountId=&limit=&offset=&type=&status=` — sorted newest first. `type` accepts `credit`/`debit` or the friendlier `deposit`/`withdrawal`/`transfer`/`payment`; `status` accepts `pending`/`completed`/`failed`
- `POST /transactions` — body: `{ accountId, type, amount, title|merchantName, description?, category?, recipient? }`. Validates a positive amount and account ownership, atomically updates the account balance (credit adds, debit subtracts), rejects if the result would go negative, and returns `{ transaction, account }`
- `POST /transfers` — body: `{ fromAccountId, toAccountId, amount, note? }`. Transfers between two of the caller's own accounts. Validates both accounts belong to the user, rejects same-account transfers and insufficient funds, and atomically creates a DEBIT transaction on the source + a CREDIT transaction on the destination + updates both balances in one `prisma.$transaction`. Returns `{ debitTransaction, creditTransaction, fromAccount, toAccount }`
- `GET /goals`
- `POST /goals` — body: `{ name, targetAmount, currentAmount?, linkedAccountId, monthlyContribution?, deadline? }`. Validates `targetAmount > 0`, `linkedAccountId` is required and must belong to the caller, and `currentAmount` (default 0) cannot exceed `targetAmount`
- `PATCH /goals/:id`
- `POST /assistant/chat` — body: `{ message }`, proxies to Claude
- `GET /assistant/history`
