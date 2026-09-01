-- CreateEnum
CREATE TYPE "SubscriptionScope" AS ENUM ('ALL', 'SINGLE_PLAN');

-- AlterTable
ALTER TABLE "activation_codes" ADD COLUMN     "planTypeId" TEXT;

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "subscriptionPlanTypeId" TEXT,
ADD COLUMN     "subscriptionScope" "SubscriptionScope";

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_token_key" ON "team_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_schoolId_email_key" ON "team_invites"("schoolId", "email");

-- AddForeignKey
ALTER TABLE "schools" ADD CONSTRAINT "schools_subscriptionPlanTypeId_fkey" FOREIGN KEY ("subscriptionPlanTypeId") REFERENCES "plan_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "plan_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
