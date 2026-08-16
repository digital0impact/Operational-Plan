-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "voteToken" TEXT,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_section_progress" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planId" TEXT NOT NULL,

    CONSTRAINT "plan_section_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_objectives" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "planId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,

    CONSTRAINT "plan_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_indicators" (
    "id" TEXT NOT NULL,
    "indicator" TEXT NOT NULL DEFAULT '',
    "targetValue" TEXT NOT NULL DEFAULT '',
    "actualValue" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "plan_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_programs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "plan_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_activities" (
    "id" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT '',
    "targetCategory" TEXT NOT NULL DEFAULT '',
    "executionRequirements" TEXT NOT NULL DEFAULT '',
    "executionDate" TEXT NOT NULL DEFAULT '',
    "responsible" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "programId" TEXT NOT NULL,

    CONSTRAINT "plan_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_evidence" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'TEXT',
    "textValue" TEXT,
    "fileData" BYTEA,
    "fileType" TEXT,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activityId" TEXT,
    "objectiveId" TEXT,

    CONSTRAINT "plan_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_voteToken_key" ON "plans"("voteToken");

-- CreateIndex
CREATE UNIQUE INDEX "plans_shareToken_key" ON "plans"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "plans_schoolId_templateId_academicYear_key" ON "plans"("schoolId", "templateId", "academicYear");

-- CreateIndex
CREATE UNIQUE INDEX "plan_section_progress_planId_sectionKey_key" ON "plan_section_progress"("planId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "plan_indicators_objectiveId_order_key" ON "plan_indicators"("objectiveId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "plan_activities_programId_order_key" ON "plan_activities"("programId", "order");

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "plan_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_section_progress" ADD CONSTRAINT "plan_section_progress_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_objectives" ADD CONSTRAINT "plan_objectives_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_indicators" ADD CONSTRAINT "plan_indicators_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "plan_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_programs" ADD CONSTRAINT "plan_programs_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "plan_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_activities" ADD CONSTRAINT "plan_activities_programId_fkey" FOREIGN KEY ("programId") REFERENCES "plan_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_evidence" ADD CONSTRAINT "plan_evidence_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "plan_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_evidence" ADD CONSTRAINT "plan_evidence_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "plan_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;
