import { Router } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';
import { asyncHandler } from '../middleware/asyncHandler';
import { shapeAccount } from '../utils/shape';
import { generateLast4 } from '../utils/generateLast4';

const router = Router();
const prisma = new PrismaClient();

const ACCOUNT_TYPES = ['CHEQUING', 'SAVINGS', 'TFSA', 'CREDIT_CARD'] as const;
type AccountTypeValue = (typeof ACCOUNT_TYPES)[number];

const DEFAULT_NAME_BY_TYPE: Record<AccountTypeValue, string> = {
  CHEQUING: 'Chequing Account',
  SAVINGS: 'Savings Account',
  TFSA: 'TFSA',
  CREDIT_CARD: 'Credit Card',
};

// New cards start with this limit unless a caller explicitly overrides it.
const DEFAULT_CREDIT_LIMIT = 2000;

// A user may hold at most one of each of these — unlike CREDIT_CARD, which
// has no cap (matches typical retail banking: one chequing, one savings, one
// TFSA per person, but multiple cards are normal).
const SINGLE_INSTANCE_TYPES = new Set<AccountTypeValue>(['CHEQUING', 'SAVINGS', 'TFSA']);

const LABEL_BY_TYPE: Record<AccountTypeValue, string> = {
  CHEQUING: 'Chequing',
  SAVINGS: 'Savings',
  TFSA: 'TFSA',
  CREDIT_CARD: 'Credit Card',
};

router.use(verifyToken);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const accounts = await prisma.account.findMany({ where: { userId: req.userId } });
    res.json(accounts.map(shapeAccount));
  })
);

/** Generates a last-4 that isn't already in use by any account. */
async function generateUniqueLast4(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateLast4();
    const existing = await prisma.account.findFirst({ where: { accountNumberLast4: candidate } });
    if (!existing) return candidate;
  }
  throw new Error('Could not generate a unique account number — please try again.');
}

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { type, name, balance, creditLimit } = req.body;

    if (!type || !ACCOUNT_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${ACCOUNT_TYPES.join(', ')}` });
    }

    const numericBalance = balance == null ? 0 : Number(balance);
    if (!Number.isFinite(numericBalance) || numericBalance < 0) {
      return res.status(400).json({ error: 'balance must be a non-negative number' });
    }

    let numericCreditLimit: number | null = null;
    if (type === 'CREDIT_CARD') {
      numericCreditLimit = creditLimit == null ? DEFAULT_CREDIT_LIMIT : Number(creditLimit);
      if (!Number.isFinite(numericCreditLimit) || numericCreditLimit <= 0) {
        return res.status(400).json({ error: 'creditLimit must be a positive number' });
      }
    }

    if (SINGLE_INSTANCE_TYPES.has(type as AccountTypeValue)) {
      const existing = await prisma.account.findFirst({ where: { userId: req.userId, type } });
      if (existing) {
        return res
          .status(409)
          .json({ error: `You already have a ${LABEL_BY_TYPE[type as AccountTypeValue]} account.` });
      }
    }

    const accountNumberLast4 = await generateUniqueLast4();

    try {
      const account = await prisma.account.create({
        data: {
          userId: req.userId!,
          type,
          name: typeof name === 'string' && name.trim() ? name.trim() : DEFAULT_NAME_BY_TYPE[type as AccountTypeValue],
          balance: numericBalance,
          creditLimit: numericCreditLimit,
          accountNumberLast4,
        },
      });
      res.status(201).json(shapeAccount(account));
    } catch (err) {
      // Safety net for the (very unlikely) race between the check above and
      // this insert: the partial unique index on (userId, type) catches it at
      // the DB layer, and we surface the same friendly message rather than a
      // raw 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res
          .status(409)
          .json({ error: `You already have a ${LABEL_BY_TYPE[type as AccountTypeValue]} account.` });
      }
      throw err;
    }
  })
);

router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json(shapeAccount(account));
  })
);

export default router;
