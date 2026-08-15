-- Phase 1: school-specific multi-plan foundation.
-- Non-destructive: keeps all existing operational-plan tables and School compatibility columns intact.

-- CreateEnum
CREATE TYPE "PlanTypeKey" AS ENUM ('SCHOOL_OPERATIONAL', 'STUDENT_ACTIVITIES', 'COUNSELING', 'SCHOOL_BROADCAST', 'HEALTH', 'SAFETY', 'PROFESSIONAL_DEVELOPMENT', 'GIFTED', 'LEARNING_SUPPORT');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "plan_types" (
    "id" TEXT NOT NULL,
    "key" "PlanTypeKey" NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "description" TEXT,
    "schemaJson" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planTypeId" TEXT NOT NULL,

    CONSTRAINT "plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "shareToken" TEXT,
    "voteToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "schoolId" TEXT NOT NULL,
    "planTypeId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_step_progress" (
    "id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" TEXT NOT NULL,
    "completedByUserId" TEXT,

    CONSTRAINT "plan_step_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_types_key_key" ON "plan_types"("key");
CREATE UNIQUE INDEX "plan_templates_key_key" ON "plan_templates"("key");
CREATE UNIQUE INDEX "plan_templates_planTypeId_key_key" ON "plan_templates"("planTypeId", "key");
CREATE UNIQUE INDEX "plans_shareToken_key" ON "plans"("shareToken");
CREATE UNIQUE INDEX "plans_voteToken_key" ON "plans"("voteToken");
CREATE UNIQUE INDEX "plans_schoolId_planTypeId_key" ON "plans"("schoolId", "planTypeId");
CREATE UNIQUE INDEX "plan_step_progress_planId_step_key" ON "plan_step_progress"("planId", "step");

-- AddForeignKey
ALTER TABLE "plan_templates" ADD CONSTRAINT "plan_templates_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "plan_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plans" ADD CONSTRAINT "plans_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plans" ADD CONSTRAINT "plans_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "plan_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plans" ADD CONSTRAINT "plans_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "plan_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "plan_step_progress" ADD CONSTRAINT "plan_step_progress_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_step_progress" ADD CONSTRAINT "plan_step_progress_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed exactly one school operational plan type.
INSERT INTO "plan_types" ("id", "key", "nameAr", "nameEn", "description", "isSystem", "isActive", "updatedAt")
VALUES (
  'plan_type_school_operational',
  'SCHOOL_OPERATIONAL',
  'الخطة التشغيلية المدرسية',
  'School Operational Plan',
  'نوع الخطة التشغيلية المدرسية الحالي؛ يبقى مستقلًا عن جداول الخطة التشغيلية القائمة في مرحلة التأسيس.',
  true,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "nameAr" = EXCLUDED."nameAr",
  "nameEn" = EXCLUDED."nameEn",
  "description" = EXCLUDED."description",
  "isSystem" = EXCLUDED."isSystem",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Seed exactly one metadata-only template representing the current 25-step operational wizard.
INSERT INTO "plan_templates" ("id", "planTypeId", "key", "version", "nameAr", "nameEn", "description", "schemaJson", "isPublished", "updatedAt")
SELECT
  'plan_template_official_operational_1447_1448',
  pt."id",
  'OFFICIAL_OPERATIONAL_1447_1448',
  '1447-1448',
  'القالب الرسمي للخطة التشغيلية 1447-1448هـ',
  'Official Operational Plan 1447-1448 Template',
  'بيانات وصفية فقط لقالب المعالج التشغيلي الحالي المكوّن من 25 خطوة؛ لا يستبدل تنفيذ المعالج الحالي في هذه المرحلة.',
  '{"wizard":{"type":"existing_operational_wizard","totalSteps":25,"metadataOnly":true}}'::jsonb,
  true,
  CURRENT_TIMESTAMP
FROM "plan_types" pt
WHERE pt."key" = 'SCHOOL_OPERATIONAL'
ON CONFLICT ("key") DO UPDATE SET
  "planTypeId" = EXCLUDED."planTypeId",
  "version" = EXCLUDED."version",
  "nameAr" = EXCLUDED."nameAr",
  "nameEn" = EXCLUDED."nameEn",
  "description" = EXCLUDED."description",
  "schemaJson" = EXCLUDED."schemaJson",
  "isPublished" = EXCLUDED."isPublished",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Backfill exactly one compatibility Plan per existing school for the operational plan.
INSERT INTO "plans" (
  "id", "schoolId", "planTypeId", "templateId", "academicYear", "title", "status",
  "currentStep", "progressPercent", "shareToken", "voteToken", "completedAt", "updatedAt"
)
SELECT
  'plan_operational_' || s."id",
  s."id",
  pt."id",
  tpl."id",
  '1447-1448',
  'الخطة التشغيلية',
  CASE
    WHEN COUNT(wsp."step") >= 25 THEN 'COMPLETED'::"PlanStatus"
    WHEN COUNT(wsp."step") > 0 OR s."currentStep" > 1 THEN 'IN_PROGRESS'::"PlanStatus"
    ELSE 'DRAFT'::"PlanStatus"
  END,
  s."currentStep",
  LEAST(100, ROUND((COUNT(wsp."step")::numeric / 25) * 100)::integer),
  s."shareToken",
  s."voteToken",
  CASE WHEN COUNT(wsp."step") >= 25 THEN CURRENT_TIMESTAMP ELSE NULL END,
  CURRENT_TIMESTAMP
FROM "schools" s
CROSS JOIN "plan_types" pt
CROSS JOIN "plan_templates" tpl
LEFT JOIN "wizard_step_progress" wsp ON wsp."schoolId" = s."id"
WHERE pt."key" = 'SCHOOL_OPERATIONAL'
  AND tpl."key" = 'OFFICIAL_OPERATIONAL_1447_1448'
GROUP BY s."id", pt."id", tpl."id"
ON CONFLICT ("schoolId", "planTypeId") DO UPDATE SET
  "templateId" = EXCLUDED."templateId",
  "academicYear" = EXCLUDED."academicYear",
  "title" = EXCLUDED."title",
  "status" = EXCLUDED."status",
  "currentStep" = EXCLUDED."currentStep",
  "progressPercent" = EXCLUDED."progressPercent",
  "shareToken" = EXCLUDED."shareToken",
  "voteToken" = EXCLUDED."voteToken",
  "completedAt" = EXCLUDED."completedAt",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Mirror existing wizard completion markers into the new progress table without touching legacy progress data.
INSERT INTO "plan_step_progress" ("id", "planId", "step", "completedAt", "createdAt", "updatedAt")
SELECT
  'plan_step_' || p."id" || '_' || wsp."step",
  p."id",
  wsp."step",
  wsp."completedAt",
  wsp."completedAt",
  CURRENT_TIMESTAMP
FROM "wizard_step_progress" wsp
JOIN "plans" p ON p."schoolId" = wsp."schoolId"
JOIN "plan_types" pt ON pt."id" = p."planTypeId" AND pt."key" = 'SCHOOL_OPERATIONAL'
ON CONFLICT ("planId", "step") DO UPDATE SET
  "completedAt" = EXCLUDED."completedAt",
  "updatedAt" = CURRENT_TIMESTAMP;
