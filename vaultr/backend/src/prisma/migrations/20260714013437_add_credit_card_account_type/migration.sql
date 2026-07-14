-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'CREDIT_CARD';

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "creditLimit" DOUBLE PRECISION;
