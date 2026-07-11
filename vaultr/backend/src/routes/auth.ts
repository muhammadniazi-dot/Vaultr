import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomInt } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/asyncHandler';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken';
import { sendVerificationEmail, VERIFICATION_CODE_TTL_MINUTES } from '../services/email';

const router = Router();
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

const CODE_TTL_MS = VERIFICATION_CODE_TTL_MINUTES * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;

/**
 * Generates a fresh 6-digit verification code, stores only its bcrypt hash
 * (with an expiry), invalidates any earlier outstanding codes for the user, and
 * emails the plaintext code. The plaintext is never persisted or logged (except
 * the dev-mode console fallback in the email service when SMTP is unconfigured).
 */
async function issueVerificationCode(userId: string, email: string): Promise<void> {
  await prisma.emailVerification.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  const codeHash = await bcrypt.hash(code, SALT_ROUNDS);

  await prisma.emailVerification.create({
    data: { userId, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
  });

  await sendVerificationEmail(email, code);
}

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ userId }, secret, { expiresIn: '30d' });
}

router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  // Kick off email verification, but don't let a mail hiccup fail the signup —
  // the user is created and can request a resend from the verify screen.
  try {
    await issueVerificationCode(user.id, user.email);
  } catch (err) {
    console.error('Failed to send verification email on signup:', err);
  }

  const token = signToken(user.id);
  const { passwordHash: _omit, ...safeUser } = user;
  res.status(201).json({ user: safeUser, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken(user.id);
  const { passwordHash: _omit, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

/**
 * Changes the signed-in user's password. Requires the current password (so a
 * stolen session token alone can't rotate the password) and rejects reusing the
 * existing one. Client-side strength/breach checks run before this is called;
 * the server enforces a basic length floor as defence in depth.
 */
router.post(
  '/change-password',
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameAsOld) {
      return res.status(400).json({ error: 'New password must be different from your current one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ ok: true });
  })
);

/** Sends (or re-sends) a verification code to the signed-in user's email. */
router.post(
  '/send-verification-email',
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }
    if (user.emailVerified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    await issueVerificationCode(user.id, user.email);
    res.json({ ok: true });
  })
);

/**
 * Same as send-verification-email but rate-limited, so tapping "Resend"
 * repeatedly can't spray emails.
 */
router.post(
  '/resend-verification-email',
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }
    if (user.emailVerified) {
      return res.json({ ok: true, alreadyVerified: true });
    }

    const lastSent = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    if (lastSent && Date.now() - lastSent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      return res.status(429).json({ error: 'Please wait a moment before requesting another code.' });
    }

    await issueVerificationCode(user.id, user.email);
    res.json({ ok: true });
  })
);

/** Verifies a submitted code and, on success, marks the user's email verified. */
router.post(
  '/verify-email',
  verifyToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { code } = req.body;
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({ error: 'Enter the 6-digit code from your email.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }
    if (user.emailVerified) {
      const { passwordHash: _v, ...safeUser } = user;
      return res.json({ user: safeUser });
    }

    // Only the most recent, unconsumed, unexpired code is valid.
    const record = await prisma.emailVerification.findFirst({
      where: { userId: user.id, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      return res.status(400).json({ error: 'Your code has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(code.trim(), record.codeHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'That code is incorrect. Please try again.' });
    }

    const [, updatedUser] = await prisma.$transaction([
      prisma.emailVerification.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
    ]);

    const { passwordHash: _omit, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  })
);

export default router;
