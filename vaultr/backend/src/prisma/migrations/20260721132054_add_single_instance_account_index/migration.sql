-- Enforces at most one CHEQUING, SAVINGS, or TFSA account per user (no cap on
-- CREDIT_CARD). This is a partial unique index — Prisma's schema DSL has no
-- way to express a conditional unique constraint, so it's hand-written here
-- rather than generated from schema.prisma.
CREATE UNIQUE INDEX "Account_userId_type_single_instance_key"
ON "Account" ("userId", "type")
WHERE "type" != 'CREDIT_CARD';
