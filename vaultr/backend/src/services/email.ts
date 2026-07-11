import nodemailer from 'nodemailer';

/**
 * Email delivery for verification codes.
 *
 * If SMTP credentials are configured (SMTP_HOST/SMTP_USER/SMTP_PASS), mail is
 * sent for real via Nodemailer. Otherwise we fall back to a dev mode that logs
 * the code to the server console, so the whole verification flow is testable
 * locally without a mailbox. The dev log only ever runs when SMTP is NOT
 * configured (i.e. never in a properly-configured production deployment).
 */

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, EMAIL_FROM } = process.env;

const isSmtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT ?? 587),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

const FROM_ADDRESS = EMAIL_FROM ?? 'Vaultr <no-reply@vaultr.app>';

export const VERIFICATION_CODE_TTL_MINUTES = 15;

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const subject = 'Your Vaultr verification code';
  const text =
    `Your Vaultr verification code is ${code}.\n\n` +
    `It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes. ` +
    `If you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; background:#0f0f0f; color:#e0e0e0; padding:32px; border-radius:16px;">
      <h2 style="margin:0 0 8px; color:#c9a84c;">Verify your email</h2>
      <p style="margin:0 0 24px; color:#999;">Enter this code in the Vaultr app to finish setting up your account.</p>
      <div style="font-size:32px; letter-spacing:8px; font-weight:bold; color:#e0e0e0;">${code}</div>
      <p style="margin:24px 0 0; color:#777; font-size:13px;">
        This code expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes. If you didn't request it, you can ignore this email.
      </p>
    </div>`;

  if (!transporter) {
    // Dev fallback — no SMTP configured. Intentionally logs the code so the
    // flow works without a real inbox during development.
    console.log(`[email:dev] Verification code for ${to}: ${code} (expires in ${VERIFICATION_CODE_TTL_MINUTES} min)`);
    return;
  }

  await transporter.sendMail({ from: FROM_ADDRESS, to, subject, text, html });
}
