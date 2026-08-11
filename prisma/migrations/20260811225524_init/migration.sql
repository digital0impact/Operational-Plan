-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "schoolSystem" TEXT NOT NULL,
    "ministryNumber" TEXT,
    "studyTime" TEXT NOT NULL,
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
    "step1CompletedAt" DATETIME,
    "step2CompletedAt" DATETIME,
    "step3CompletedAt" DATETIME,
    "step4CompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "activation_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "issuedFor" TEXT,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,
    CONSTRAINT "activation_codes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SCHOOL_MANAGER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT,
    CONSTRAINT "users_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "procedure_inputs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "procedure_inputs_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE UNIQUE INDEX "procedure_inputs_schoolId_type_key" ON "procedure_inputs"("schoolId", "type");
