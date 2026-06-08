-- AlterTable
ALTER TABLE "LostReport" ADD COLUMN     "color" TEXT,
ADD COLUMN     "helpersCreditedAt" TIMESTAMP(3),
ADD COLUMN     "size" TEXT;

-- CreateTable
CREATE TABLE "FoundSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foundId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoundSubscription_foundId_idx" ON "FoundSubscription"("foundId");

-- CreateIndex
CREATE UNIQUE INDEX "FoundSubscription_userId_foundId_key" ON "FoundSubscription"("userId", "foundId");

-- AddForeignKey
ALTER TABLE "FoundSubscription" ADD CONSTRAINT "FoundSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundSubscription" ADD CONSTRAINT "FoundSubscription_foundId_fkey" FOREIGN KEY ("foundId") REFERENCES "FoundReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

