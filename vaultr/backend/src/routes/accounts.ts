import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';
import { asyncHandler } from '../middleware/asyncHandler';
import { shapeAccount } from '../utils/shape';
import { generateLast4 } from '../utils/generateLast4';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);

router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const accounts = await prisma.account.findMany({ where: { userId: req.userId } });
    res.json(accounts.map(shapeAccount));
  })
);

router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { type, name, balance } = req.body;
    if (!type || !name) {
      return res.status(400).json({ error: 'type and name are required' });
    }

    const account = await prisma.account.create({
      data: {
        userId: req.userId!,
        type,
        name,
        balance: balance ?? 0,
        accountNumberLast4: generateLast4(),
      },
    });
    res.status(201).json(shapeAccount(account));
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
