-- CreateTable
CREATE TABLE "plan_program_week_tags" (
    "id" TEXT NOT NULL,
    "weekOrder" INTEGER NOT NULL,
    "programId" TEXT NOT NULL,

    CONSTRAINT "plan_program_week_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_program_week_tags_programId_weekOrder_key" ON "plan_program_week_tags"("programId", "weekOrder");

-- AddForeignKey
ALTER TABLE "plan_program_week_tags" ADD CONSTRAINT "plan_program_week_tags_programId_fkey" FOREIGN KEY ("programId") REFERENCES "plan_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
