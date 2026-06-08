-- AlterTable
ALTER TABLE "Sighting" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "Reunion" (
    "id" TEXT NOT NULL,
    "reportId" TEXT,
    "userId" TEXT,
    "petName" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "photo" TEXT,
    "district" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reunion_createdAt_idx" ON "Reunion"("createdAt");

-- CreateIndex
CREATE INDEX "Sighting_userId_idx" ON "Sighting"("userId");

-- AddForeignKey
ALTER TABLE "Sighting" ADD CONSTRAINT "Sighting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reunion" ADD CONSTRAINT "Reunion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "LostReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reunion" ADD CONSTRAINT "Reunion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

