-- CreateTable
CREATE TABLE "plan_types" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_templates" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "planTypeId" TEXT NOT NULL,

    CONSTRAINT "plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_template_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "kind" TEXT NOT NULL,
    "configJson" JSONB,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "plan_template_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_types_key_key" ON "plan_types"("key");

-- CreateIndex
CREATE UNIQUE INDEX "plan_templates_planTypeId_version_key" ON "plan_templates"("planTypeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "plan_template_sections_templateId_key_key" ON "plan_template_sections"("templateId", "key");

-- AddForeignKey
ALTER TABLE "plan_templates" ADD CONSTRAINT "plan_templates_planTypeId_fkey" FOREIGN KEY ("planTypeId") REFERENCES "plan_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_template_sections" ADD CONSTRAINT "plan_template_sections_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "plan_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
