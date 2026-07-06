import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';
import { asyncHandler } from '../middleware/asyncHandler';
import { shapeAccount, shapeTransaction } from '../utils/shape';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);

/**
 * Transfers between two of the caller's own accounts. Unlike POST
 * /transactions (which touches one account), this needs to be atomic across
 * two accounts and two transaction rows, so it gets its own endpoint rather
 * than being modeled as two separate /transactions calls from the client —
 * that would leave a window where a debit could succeed with no matching
 * credit if the second call failed.
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { fromAccountId, toAccountId, amount, note } = req.body;

    if (!fromAccountId || !toAccountId || amount == null) {
      return res.status(400).json({ error: 'fromAccountId, toAccountId, and amount are required' });
    }

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    // Scoping both lookups to userId means a mismatched account returns the
    // same 404 whether it doesn't exist or belongs to someone else —
    // consistent with the existing /accounts and /transactions patterns.
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId: req.userId } }),
      prisma.account.findFirst({ where: { id: toAccountId, userId: req.userId } }),
    ]);

    if (!fromAccount || !toAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const newFromBalance = fromAccount.balance - numericAmount;
    if (newFromBalance < 0) {
      return res.status(400).json({ error: 'Insufficient funds for this transfer' });
    }
    const newToBalance = toAccount.balance + numericAmount;

    const [debitTransaction, creditTransaction, updatedFromAccount, updatedToAccount] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          accountId: fromAccountId,
          userId: req.userId!,
          amount: numericAmount,
          type: 'DEBIT',
          category: 'Transfer',
          merchantName: `Transfer to ${toAccount.name}`,
          description: note ?? null,
          recipient: toAccount.name,
          status: 'COMPLETED',
        },
      }),
      prisma.transaction.create({
        data: {
          accountId: toAccountId,
          userId: req.userId!,
          amount: numericAmount,
          type: 'CREDIT',
          category: 'Transfer',
          merchantName: `Transfer from ${fromAccount.name}`,
          description: note ?? null,
          recipient: fromAccount.name,
          status: 'COMPLETED',
        },
      }),
      prisma.account.update({ where: { id: fromAccountId }, data: { balance: newFromBalance } }),
      prisma.account.update({ where: { id: toAccountId }, data: { balance: newToBalance } }),
    ]);

    res.status(201).json({
      debitTransaction: shapeTransaction(debitTransaction),
      creditTransaction: shapeTransaction(creditTransaction),
      fromAccount: shapeAccount(updatedFromAccount),
      toAccount: shapeAccount(updatedToAccount),
    });
  })
);

export default router;
