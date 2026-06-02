-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "district" TEXT,
    "telegram" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "sex" TEXT,
    "age" TEXT,
    "size" TEXT,
    "color" TEXT,
    "marks" TEXT,
    "chip" TEXT,
    "marksText" TEXT,
    "district" TEXT,
    "address" TEXT,
    "walkSpots" TEXT,
    "temperament" TEXT,
    "ownerPhone" TEXT,
    "extraPhone" TEXT,
    "telegram" TEXT,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'home',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    CONSTRAINT "Pet_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoundEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petName" TEXT,
    "district" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
