-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "schoolSystem" TEXT NOT NULL,
    "ministryNumber" TEXT,
    "studyTime" TEXT,
    "studentsCount" INTEGER,
    "classroomsCount" INTEGER,
    "gender" TEXT NOT NULL,
    "buildingType" TEXT,
    "educationType" TEXT,
    "buildingIndependence" TEXT,
    "phone" TEXT,
    "schoolEmail" TEXT,
    "address" TEXT,
    "performanceGeneral" TEXT,
    "performanceManagement" TEXT,
    "performanceTeachingLearning" TEXT,
    "performanceLearningOutcomes" TEXT,
    "performanceEnvironment" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "voteToken" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wizard_step_progress" (
    "id" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "wizard_step_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "issuedFor" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,

    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SCHOOL_MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "strategic_goals" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "strategic_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_goals" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "schoolId" TEXT NOT NULL,
    "strategicGoalId" TEXT NOT NULL,

    CONSTRAINT "operational_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "indicator" TEXT NOT NULL DEFAULT '',
    "targetValue" TEXT NOT NULL DEFAULT '',
    "operationalGoalId" TEXT NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swot_items" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "swot_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_issues" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "key_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initiatives_programs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "operationalGoalId" TEXT NOT NULL,

    CONSTRAINT "initiatives_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "voterName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiativeId" TEXT NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" TEXT NOT NULL,
    "activity" TEXT NOT NULL DEFAULT '',
    "targetCategory" TEXT NOT NULL DEFAULT '',
    "executionRequirements" TEXT NOT NULL DEFAULT '',
    "executionDate" TEXT NOT NULL DEFAULT '',
    "responsible" TEXT NOT NULL DEFAULT '',
    "evidence" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "initiativeId" TEXT NOT NULL,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedure_inputs" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "procedure_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_voteToken_key" ON "schools"("voteToken");

-- CreateIndex
CREATE UNIQUE INDEX "schools_shareToken_key" ON "schools"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "wizard_step_progress_schoolId_step_key" ON "wizard_step_progress"("schoolId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_code_key" ON "activation_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "activation_codes_schoolId_key" ON "activation_codes"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "strategic_goals_order_key" ON "strategic_goals"("order");

-- CreateIndex
CREATE UNIQUE INDEX "operational_goals_schoolId_strategicGoalId_key" ON "operational_goals"("schoolId", "strategicGoalId");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_operationalGoalId_key" ON "kpis"("operationalGoalId");

-- CreateIndex
CREATE UNIQUE INDEX "action_items_initiativeId_order_key" ON "action_items"("initiativeId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "procedure_inputs_schoolId_type_key" ON "procedure_inputs"("schoolId", "type");

-- AddForeignKey
ALTER TABLE "wizard_step_progress" ADD CONSTRAINT "wizard_step_progress_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activation_codes" ADD CONSTRAINT "activation_codes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_goals" ADD CONSTRAINT "operational_goals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operational_goals" ADD CONSTRAINT "operational_goals_strategicGoalId_fkey" FOREIGN KEY ("strategicGoalId") REFERENCES "strategic_goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_operationalGoalId_fkey" FOREIGN KEY ("operationalGoalId") REFERENCES "operational_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swot_items" ADD CONSTRAINT "swot_items_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_issues" ADD CONSTRAINT "key_issues_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initiatives_programs" ADD CONSTRAINT "initiatives_programs_operationalGoalId_fkey" FOREIGN KEY ("operationalGoalId") REFERENCES "operational_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "initiatives_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "initiatives_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedure_inputs" ADD CONSTRAINT "procedure_inputs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
