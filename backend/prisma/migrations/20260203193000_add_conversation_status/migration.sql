-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "conversations" ADD COLUMN     "closedAt" TIMESTAMP(3);
ALTER TABLE "conversations" ADD COLUMN     "ongId" TEXT;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ongs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
