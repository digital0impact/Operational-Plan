-- AlterTable
ALTER TABLE "plan_activities" ADD COLUMN     "estimatedBudget" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "planningNote" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "regulatorySecurityRequirements" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "supervisor" TEXT NOT NULL DEFAULT '';
