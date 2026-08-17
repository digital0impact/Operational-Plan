-- CreateTable
CREATE TABLE "plan_grid_rows" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "planId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,

    CONSTRAINT "plan_grid_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_grid_weeks" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "planId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,

    CONSTRAINT "plan_grid_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_grid_cells" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "rowId" TEXT NOT NULL,
    "weekOrder" INTEGER NOT NULL,

    CONSTRAINT "plan_grid_cells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_grid_rows_planId_sectionKey_order_key" ON "plan_grid_rows"("planId", "sectionKey", "order");

-- CreateIndex
CREATE UNIQUE INDEX "plan_grid_weeks_planId_sectionKey_order_key" ON "plan_grid_weeks"("planId", "sectionKey", "order");

-- CreateIndex
CREATE UNIQUE INDEX "plan_grid_cells_rowId_weekOrder_key" ON "plan_grid_cells"("rowId", "weekOrder");

-- AddForeignKey
ALTER TABLE "plan_grid_rows" ADD CONSTRAINT "plan_grid_rows_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grid_weeks" ADD CONSTRAINT "plan_grid_weeks_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_grid_cells" ADD CONSTRAINT "plan_grid_cells_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "plan_grid_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
