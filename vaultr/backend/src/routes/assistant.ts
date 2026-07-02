import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { AuthenticatedRequest, verifyToken } from '../middleware/verifyToken';

const router = Router();
const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

router.use(verifyToken);

router.post('/chat', async (req: AuthenticatedRequest, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message }],
  });

  const content = response.content.find((block) => block.type === 'text');
  res.json({
    id: response.id,
    role: 'assistant',
    content: content?.type === 'text' ? content.text : '',
    createdAt: new Date().toISOString(),
  });
});

router.get('/history', async (_req: AuthenticatedRequest, res) => {
  res.json([]);
});

export default router;
