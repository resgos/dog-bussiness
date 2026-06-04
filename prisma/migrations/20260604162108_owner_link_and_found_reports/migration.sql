-- AlterTable
ALTER TABLE "LostReport" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "FoundReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "finderName" TEXT,
    "contactPhone" TEXT,
    "contactTelegram" TEXT,
    "photo" TEXT,
    "breed" TEXT,
    "color" TEXT,
    "size" TEXT,
    "district" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoundReport_userId_idx" ON "FoundReport"("userId");

-- CreateIndex
CREATE INDEX "FoundReport_district_idx" ON "FoundReport"("district");

-- CreateIndex
CREATE INDEX "FoundReport_status_idx" ON "FoundReport"("status");

-- CreateIndex
CREATE INDEX "LostReport_userId_idx" ON "LostReport"("userId");

-- CreateIndex
CREATE INDEX "LostReport_status_idx" ON "LostReport"("status");

-- AddForeignKey
ALTER TABLE "LostReport" ADD CONSTRAINT "LostReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundReport" ADD CONSTRAINT "FoundReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
