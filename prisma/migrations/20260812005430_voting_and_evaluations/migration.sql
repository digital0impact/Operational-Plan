/*
  Warnings:

  - Added the required column `shareToken` to the `schools` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voteToken` to the `schools` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voterName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiativeId" TEXT NOT NULL,
    CONSTRAINT "votes_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "initiatives_programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "evaluations_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "voteToken" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_schools" ("address", "buildingIndependence", "buildingType", "classroomsCount", "createdAt", "currentStep", "educationType", "gender", "id", "ministryNumber", "name", "performanceEnvironment", "performanceGeneral", "performanceLearningOutcomes", "performanceManagement", "performanceTeachingLearning", "phone", "schoolEmail", "schoolSystem", "studentsCount", "studyTime", "unit", "updatedAt") SELECT "address", "buildingIndependence", "buildingType", "classroomsCount", "createdAt", "currentStep", "educationType", "gender", "id", "ministryNumber", "name", "performanceEnvironment", "performanceGeneral", "performanceLearningOutcomes", "performanceManagement", "performanceTeachingLearning", "phone", "schoolEmail", "schoolSystem", "studentsCount", "studyTime", "unit", "updatedAt" FROM "schools";
DROP TABLE "schools";
ALTER TABLE "new_schools" RENAME TO "schools";
CREATE UNIQUE INDEX "schools_voteToken_key" ON "schools"("voteToken");
CREATE UNIQUE INDEX "schools_shareToken_key" ON "schools"("shareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
