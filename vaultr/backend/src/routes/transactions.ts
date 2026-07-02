import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const { accountId } = req.query;
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      ...(accountId ? { accountId: String(accountId) } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transactions);
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const { accountId, amount, type, category, merchantName, description } = req.body;
  if (!accountId || amount == null || !type || !category || !merchantName) {
    return res.status(400).json({ error: 'accountId, amount, type, category, and merchantName are required' });
  }

  const transaction = await prisma.transaction.create({
    data: {
      accountId,
      userId: req.userId!,
      amount,
      type,
      category,
      merchantName,
      description,
    },
  });
  res.status(201).json(transaction);
});

export default router;
