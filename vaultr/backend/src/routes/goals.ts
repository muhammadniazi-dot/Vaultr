import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);

router.get('/', async (req: AuthenticatedRequest, res) => {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId } });
  res.json(goals);
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  const { name, targetAmount, currentAmount, linkedAccountId, monthlyContribution, deadline } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const numericTarget = Number(targetAmount);
  if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
    return res.status(400).json({ error: 'targetAmount must be a positive number' });
  }
  if (!linkedAccountId) {
    return res.status(400).json({ error: 'linkedAccountId is required' });
  }

  const numericCurrent = currentAmount == null ? 0 : Number(currentAmount);
  if (!Number.isFinite(numericCurrent) || numericCurrent < 0) {
    return res.status(400).json({ error: 'currentAmount must be a non-negative number' });
  }
  if (numericCurrent > numericTarget) {
    return res.status(400).json({ error: 'currentAmount cannot exceed targetAmount' });
  }

  let numericContribution: number | null = null;
  if (monthlyContribution != null) {
    numericContribution = Number(monthlyContribution);
    if (!Number.isFinite(numericContribution) || numericContribution < 0) {
      return res.status(400).json({ error: 'monthlyContribution must be a non-negative number' });
    }
  }

  const account = await prisma.account.findFirst({ where: { id: linkedAccountId, userId: req.userId } });
  if (!account) {
    return res.status(404).json({ error: 'Linked account not found' });
  }

  const goal = await prisma.goal.create({
    data: {
      userId: req.userId!,
      name: name.trim(),
      targetAmount: numericTarget,
      currentAmount: numericCurrent,
      linkedAccountId,
      monthlyContribution: numericContribution,
      deadline: deadline ? new Date(deadline) : undefined,
    },
  });
  res.status(201).json(goal);
});

router.patch('/:id', async (req: AuthenticatedRequest, res) => {
  const goal = await prisma.goal.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const updated = await prisma.goal.update({
    where: { id: goal.id },
    data: req.body,
  });
  res.json(updated);
});

export default router;
