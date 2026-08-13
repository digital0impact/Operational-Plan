-- CreateTable
CREATE TABLE "classroom_visits" (
    "id" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "subject" TEXT,
    "className" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "responseToken" TEXT NOT NULL,
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "schoolId" TEXT NOT NULL,

    CONSTRAINT "classroom_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "classroom_visits_responseToken_key" ON "classroom_visits"("responseToken");

-- AddForeignKey
ALTER TABLE "classroom_visits" ADD CONSTRAINT "classroom_visits_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

