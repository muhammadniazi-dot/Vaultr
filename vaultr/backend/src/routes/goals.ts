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
  const { name, targetAmount, currentAmount, linkedAccountId, deadline } = req.body;
  if (!name || targetAmount == null) {
    return res.status(400).json({ error: 'name and targetAmount are required' });
  }

  const goal = await prisma.goal.create({
    data: {
      userId: req.userId!,
      name,
      targetAmount,
      currentAmount: currentAmount ?? 0,
      linkedAccountId,
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
