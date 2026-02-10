-- CreateEnum
CREATE TYPE "NeedStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "donorId" TEXT,
ADD COLUMN     "needId" TEXT,
ALTER COLUMN "donationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "needs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" TEXT,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "NeedStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "ongId" TEXT NOT NULL,

    CONSTRAINT "needs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "needs" ADD CONSTRAINT "needs_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_needId_fkey" FOREIGN KEY ("needId") REFERENCES "needs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
