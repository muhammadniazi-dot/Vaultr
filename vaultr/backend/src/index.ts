import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import accountsRoutes from './routes/accounts';
import transactionsRoutes from './routes/transactions';
import goalsRoutes from './routes/goals';
import assistantRoutes from './routes/assistant';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ name: 'Vaultr API', status: 'ok' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/accounts', accountsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/goals', goalsRoutes);
app.use('/assistant', assistantRoutes);

// Catches errors forwarded by asyncHandler-wrapped routes (and anything else
// that calls next(err)) so unexpected/DB errors return a clean 500 instead of
// hanging the request.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Vaultr API listening on port ${PORT}`);
});
