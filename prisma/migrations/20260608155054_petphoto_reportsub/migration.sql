-- CreateTable
CREATE TABLE "PetPhoto" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PetPhoto_petId_idx" ON "PetPhoto"("petId");

-- CreateIndex
CREATE INDEX "ReportSubscription_reportId_idx" ON "ReportSubscription"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSubscription_userId_reportId_key" ON "ReportSubscription"("userId", "reportId");

-- AddForeignKey
ALTER TABLE "PetPhoto" ADD CONSTRAINT "PetPhoto_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSubscription" ADD CONSTRAINT "ReportSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSubscription" ADD CONSTRAINT "ReportSubscription_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "LostReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

