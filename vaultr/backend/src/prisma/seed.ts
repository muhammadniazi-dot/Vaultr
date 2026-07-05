import { PrismaClient } from '@prisma/client';
import { generateLast4 } from '../utils/generateLast4';

const prisma = new PrismaClient();

function daysAgo(days: number, hour = 12): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

interface SeedTransaction {
  amount: number; // signed: positive = CREDIT, negative = DEBIT
  category: string;
  merchantName: string;
  description?: string;
  recipient?: string;
  daysAgo: number;
}

const CHEQUING_TRANSACTIONS: SeedTransaction[] = [
  { amount: 2400.0, category: 'Payroll', merchantName: 'Payroll Deposit', daysAgo: 14 },
  { amount: -86.42, category: 'Groceries', merchantName: 'Loblaws', daysAgo: 13 },
  { amount: -6.75, category: 'Coffee', merchantName: 'Tim Hortons', daysAgo: 13 },
  { amount: -3.35, category: 'Transportation', merchantName: 'TTC', daysAgo: 12 },
  { amount: -142.1, category: 'Utilities', merchantName: 'Hydro One', daysAgo: 11 },
  { amount: -10.99, category: 'Subscriptions', merchantName: 'Spotify', daysAgo: 10 },
  {
    amount: -150.0,
    category: 'Transfer',
    merchantName: 'Interac e-Transfer',
    recipient: 'J. Smith',
    daysAgo: 9,
  },
  { amount: -5.25, category: 'Coffee', merchantName: 'Tim Hortons', daysAgo: 8 },
  { amount: -34.2, category: 'Shopping', merchantName: 'Shoppers Drug Mart', daysAgo: 7 },
  { amount: -68.9, category: 'Dining', merchantName: 'The Keg', daysAgo: 6 },
  { amount: -22.15, category: 'Transportation', merchantName: 'Uber', daysAgo: 5 },
  { amount: -102.35, category: 'Groceries', merchantName: 'Loblaws', daysAgo: 4 },
  { amount: 2400.0, category: 'Payroll', merchantName: 'Payroll Deposit', daysAgo: 0 },
  { amount: -4.5, category: 'Coffee', merchantName: 'Tim Hortons', daysAgo: 0 },
];

const SAVINGS_TRANSACTIONS: SeedTransaction[] = [
  { amount: 1500.0, category: 'Transfer', merchantName: 'Transfer from Chequing', daysAgo: 20 },
  { amount: 500.0, category: 'Transfer', merchantName: 'Transfer from Chequing', daysAgo: 14 },
  { amount: 12.4, category: 'Interest', merchantName: 'Interest Payment', daysAgo: 1 },
];

const TFSA_TRANSACTIONS: SeedTransaction[] = [
  { amount: 5000.0, category: 'Investment', merchantName: 'TFSA Contribution', daysAgo: 10 },
  { amount: 45.6, category: 'Investment', merchantName: 'Investment Growth', daysAgo: 2 },
];

function sumAmounts(transactions: SeedTransaction[]): number {
  return Math.round(transactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
}

async function seedAccountWithTransactions(
  userId: string,
  type: 'CHEQUING' | 'SAVINGS' | 'TFSA',
  name: string,
  transactions: SeedTransaction[]
) {
  const account = await prisma.account.create({
    data: {
      userId,
      type,
      name,
      balance: sumAmounts(transactions),
      accountNumberLast4: generateLast4(),
    },
  });

  for (const t of transactions) {
    await prisma.transaction.create({
      data: {
        accountId: account.id,
        userId,
        amount: Math.abs(t.amount),
        type: t.amount >= 0 ? 'CREDIT' : 'DEBIT',
        category: t.category,
        merchantName: t.merchantName,
        description: t.description ?? null,
        recipient: t.recipient ?? null,
        status: 'COMPLETED',
        createdAt: daysAgo(t.daysAgo),
      },
    });
  }

  return account;
}

async function main() {
  const users = await prisma.user.findMany();

  if (users.length === 0) {
    console.log('No users found — sign up or log in through the app first, then re-run the seed.');
    return;
  }

  for (const user of users) {
    const existingAccountCount = await prisma.account.count({ where: { userId: user.id } });
    if (existingAccountCount > 0) {
      console.log(`Skipping ${user.email} — already has ${existingAccountCount} account(s).`);
      continue;
    }

    await seedAccountWithTransactions(user.id, 'CHEQUING', 'Chequing Account', CHEQUING_TRANSACTIONS);
    await seedAccountWithTransactions(user.id, 'SAVINGS', 'Savings Account', SAVINGS_TRANSACTIONS);
    await seedAccountWithTransactions(user.id, 'TFSA', 'TFSA', TFSA_TRANSACTIONS);

    const total = CHEQUING_TRANSACTIONS.length + SAVINGS_TRANSACTIONS.length + TFSA_TRANSACTIONS.length;
    console.log(`Seeded ${user.email}: 3 accounts, ${total} transactions.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
