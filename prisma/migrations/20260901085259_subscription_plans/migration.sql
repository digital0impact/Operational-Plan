-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PAID');

-- DropIndex
DROP INDEX "activation_codes_schoolId_key";

-- AlterTable
ALTER TABLE "activation_codes" ADD COLUMN     "durationMonths" INTEGER NOT NULL DEFAULT 12;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';
