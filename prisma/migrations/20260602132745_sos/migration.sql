-- CreateTable
CREATE TABLE "LostReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT,
    "petName" TEXT NOT NULL,
    "breed" TEXT,
    "photo" TEXT,
    "district" TEXT,
    "lat" REAL,
    "lng" REAL,
    "lostAt" DATETIME,
    "comment" TEXT,
    "radiusKm" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Sighting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT,
    "lat" REAL,
    "lng" REAL,
    "comment" TEXT,
    "photo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sighting_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "LostReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
