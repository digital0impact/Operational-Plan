-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "step1CompletedAt" DATETIME,
    "step2CompletedAt" DATETIME,
    "step3CompletedAt" DATETIME,
    "step4CompletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_schools" ("address", "buildingIndependence", "buildingType", "classroomsCount", "createdAt", "currentStep", "educationType", "gender", "id", "ministryNumber", "name", "performanceEnvironment", "performanceGeneral", "performanceLearningOutcomes", "performanceManagement", "performanceTeachingLearning", "phone", "schoolEmail", "schoolSystem", "step1CompletedAt", "step2CompletedAt", "step3CompletedAt", "step4CompletedAt", "studentsCount", "studyTime", "unit", "updatedAt") SELECT "address", "buildingIndependence", "buildingType", "classroomsCount", "createdAt", "currentStep", "educationType", "gender", "id", "ministryNumber", "name", "performanceEnvironment", "performanceGeneral", "performanceLearningOutcomes", "performanceManagement", "performanceTeachingLearning", "phone", "schoolEmail", "schoolSystem", "step1CompletedAt", "step2CompletedAt", "step3CompletedAt", "step4CompletedAt", "studentsCount", "studyTime", "unit", "updatedAt" FROM "schools";
DROP TABLE "schools";
ALTER TABLE "new_schools" RENAME TO "schools";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
