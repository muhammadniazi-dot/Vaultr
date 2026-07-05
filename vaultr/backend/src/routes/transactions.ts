import { Router } from 'express';
import { Prisma, PrismaClient, TransactionStatus } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';
import { asyncHandler } from '../middleware/asyncHandler';
import { shapeAccount, shapeTransaction } from '../utils/shape';
import { defaultCategoryFor, normalizeTransactionType } from '../utils/transactionType';

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const VALID_STATUSES = new Set<string>(['PENDING', 'COMPLETED', 'FAILED']);

router.use(verifyToken);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, limit, offset, type, status } = req.query;

    const take = Math.min(Math.max(parseInt(String(limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const skip = Math.max(parseInt(String(offset ?? 0), 10) || 0, 0);

    const where: Prisma.TransactionWhereInput = { userId: req.userId };

    if (accountId) {
      where.accountId = String(accountId);
    }

    if (type) {
      const normalized = normalizeTransactionType(String(type));
      if (!normalized) {
        return res.status(400).json({ error: 'type must be one of deposit, withdrawal, transfer, payment, credit, debit' });
      }
      where.type = normalized.dbType;
    }

    if (status) {
      const normalizedStatus = String(status).toUpperCase();
      if (!VALID_STATUSES.has(normalizedStatus)) {
        return res.status(400).json({ error: 'status must be one of pending, completed, failed' });
      }
      where.status = normalizedStatus as TransactionStatus;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    res.json(transactions.map(shapeTransaction));
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { accountId, type, amount, title, merchantName, description, category, recipient } = req.body;
    const name = title ?? merchantName;

    if (!accountId || !type || amount == null || !name) {
      return res.status(400).json({ error: 'accountId, type, amount, and title/merchantName are required' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const normalized = normalizeTransactionType(String(type));
    if (!normalized) {
      return res.status(400).json({ error: 'type must be one of deposit, withdrawal, transfer, payment, credit, debit' });
    }

    // Scoping the lookup to userId (not just id) means a mismatched account
    // returns the same 404 whether it doesn't exist or belongs to someone
    // else — consistent with the existing GET /accounts/:id pattern, and
    // avoids leaking which account IDs exist to other users.
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId: req.userId },
    });
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const signedDelta = normalized.dbType === 'CREDIT' ? numericAmount : -numericAmount;
    const newBalance = account.balance + signedDelta;

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient funds for this transaction' });
    }

    const [transaction, updatedAccount] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          accountId,
          userId: req.userId!,
          amount: numericAmount,
          type: normalized.dbType,
          category: category ?? defaultCategoryFor(String(type)),
          merchantName: name,
          description: description ?? null,
          recipient: recipient ?? null,
          status: 'COMPLETED',
        },
      }),
      prisma.account.update({
        where: { id: accountId },
        data: { balance: newBalance },
      }),
    ]);

    res.status(201).json({
      transaction: shapeTransaction(transaction),
      account: shapeAccount(updatedAccount),
    });
  })
);

export default router;
