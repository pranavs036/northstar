-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'AUDIT', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('PENDING', 'SCANNING', 'ANALYZING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "Engine" AS ENUM ('CHATGPT', 'GOOGLE', 'PERPLEXITY', 'BING');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "supabaseId" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "skuCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "url" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'PENDING',
    "agentScore" INTEGER,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanResult" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "engine" "Engine" NOT NULL,
    "query" TEXT NOT NULL,
    "brandVisible" BOOLEAN NOT NULL,
    "competitorDomain" TEXT,
    "rawResponse" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "engine" "Engine" NOT NULL,
    "severity" "Severity" NOT NULL,
    "reason" TEXT NOT NULL,
    "fix" TEXT NOT NULL,
    "competitorData" JSONB,
    "brandPdpData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_email_key" ON "Brand"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_supabaseId_key" ON "Brand"("supabaseId");

-- CreateIndex
CREATE INDEX "Sku_brandId_idx" ON "Sku"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "Sku_brandId_skuCode_key" ON "Sku"("brandId", "skuCode");

-- CreateIndex
CREATE INDEX "Competitor_brandId_idx" ON "Competitor"("brandId");

-- CreateIndex
CREATE INDEX "Audit_brandId_idx" ON "Audit"("brandId");

-- CreateIndex
CREATE INDEX "ScanResult_skuId_idx" ON "ScanResult"("skuId");

-- CreateIndex
CREATE INDEX "Diagnosis_auditId_idx" ON "Diagnosis"("auditId");

-- CreateIndex
CREATE INDEX "Diagnosis_skuId_idx" ON "Diagnosis"("skuId");

-- AddForeignKey
ALTER TABLE "Sku" ADD CONSTRAINT "Sku_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanResult" ADD CONSTRAINT "ScanResult_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;
