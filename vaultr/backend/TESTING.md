# Manual testing — Accounts & Transactions API

This project has no test framework installed yet (no Jest/Vitest/Supertest in
`package.json`), so rather than pull in a new dependency for a handful of
routes, here's a curl-based walkthrough covering the same cases a test suite
would. Run these against a local dev server (`npm run dev`) or your deployed
Render URL — just swap `BASE_URL`.

```bash
BASE_URL="http://localhost:4000"
```

## 1. Log in and grab a token

```bash
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}' | tee /tmp/login.json

TOKEN=$(node -e "console.log(require('/tmp/login.json').token)")
```

If you haven't seeded data yet, run `npm run seed` first (see README) so this
user has accounts and transactions to fetch.

## 2. Fetch accounts — `GET /accounts`

```bash
curl -s "$BASE_URL/accounts" -H "Authorization: Bearer $TOKEN"
```

Expect `200` and an array of accounts, each with `balance`, `availableBalance`,
`accountNumberLast4`, `currency: "CAD"`, `institutionName`, `createdAt`,
`updatedAt`.

## 3. Fetch transactions — `GET /transactions`

```bash
# All transactions, newest first
curl -s "$BASE_URL/transactions" -H "Authorization: Bearer $TOKEN"

# Filtered by account
ACCOUNT_ID="<paste an id from step 2>"
curl -s "$BASE_URL/transactions?accountId=$ACCOUNT_ID" -H "Authorization: Bearer $TOKEN"

# Paginated
curl -s "$BASE_URL/transactions?limit=5&offset=5" -H "Authorization: Bearer $TOKEN"

# Filtered by friendly type / status
curl -s "$BASE_URL/transactions?type=deposit" -H "Authorization: Bearer $TOKEN"
curl -s "$BASE_URL/transactions?status=completed" -H "Authorization: Bearer $TOKEN"
```

Expect `200` and each transaction shaped with `type` (CREDIT/DEBIT, kept for
the existing frontend), `direction` (inflow/outflow), `title`, `category`,
`amount`, `status` (lowercase), `date`.

## 4. Create a deposit — `POST /transactions`

```bash
curl -s -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"type\":\"deposit\",\"amount\":50,\"title\":\"Test Deposit\"}"
```

Expect `201` with `{ transaction, account }`, and `account.balance` increased
by exactly `50`.

## 5. Create a withdrawal — `POST /transactions`

```bash
curl -s -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"type\":\"withdrawal\",\"amount\":20,\"title\":\"Test Withdrawal\"}"
```

Expect `201`, `account.balance` decreased by `20`.

## 6. Invalid account ID

```bash
curl -s -o /dev/stderr -w "\nHTTP %{http_code}\n" -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"accountId":"00000000-0000-0000-0000-000000000000","type":"deposit","amount":10,"title":"x"}'
```

Expect `404` — `{ "error": "Account not found" }`.

## 7. Insufficient funds

Pick an account and try to withdraw more than its current balance:

```bash
curl -s -o /dev/stderr -w "\nHTTP %{http_code}\n" -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"accountId\":\"$ACCOUNT_ID\",\"type\":\"withdrawal\",\"amount\":999999,\"title\":\"Too much\"}"
```

Expect `400` — `{ "error": "Insufficient funds for this transaction" }`, and
the account balance is unchanged (verify with step 2 again).

## 8. Unauthorized access

```bash
# No token at all
curl -s -o /dev/stderr -w "\nHTTP %{http_code}\n" "$BASE_URL/accounts"
# Expect 401 — { "error": "Missing authentication token" }

# Garbage token
curl -s -o /dev/stderr -w "\nHTTP %{http_code}\n" "$BASE_URL/accounts" -H "Authorization: Bearer not-a-real-token"
# Expect 401 — { "error": "Invalid or expired token" }
```

## 9. Other users' data is never exposed

Log in as a second user, grab their token, and confirm `GET /accounts` /
`GET /transactions` only ever return that user's own rows — and that passing
the first user's `accountId` in a `POST /transactions` body while
authenticated as the second user returns the same `404` as an account that
doesn't exist at all (this is deliberate — see the "assumptions" note in the
implementation summary about not distinguishing 403 from 404 here).
