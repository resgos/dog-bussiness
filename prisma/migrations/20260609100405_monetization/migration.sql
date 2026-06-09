-- AlterTable
ALTER TABLE "LostReport" ADD COLUMN     "boostedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promotedUntil" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'approved';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "planUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "refId" TEXT,
    "amountRub" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_userId_idx" ON "Purchase"("userId");

-- CreateIndex
CREATE INDEX "Purchase_kind_idx" ON "Purchase"("kind");

-- CreateIndex
CREATE INDEX "Partner_status_idx" ON "Partner"("status");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

