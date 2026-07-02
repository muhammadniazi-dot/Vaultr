import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const accounts = await prisma.account.findMany({ where: { userId: req.userId } });
  res.json(accounts);
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const { type, name, balance } = req.body;
  if (!type || !name) {
    return res.status(400).json({ error: 'type and name are required' });
  }

  const account = await prisma.account.create({
    data: { userId: req.userId!, type, name, balance: balance ?? 0 },
  });
  res.status(201).json(account);
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  const account = await prisma.account.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
});

export default router;
