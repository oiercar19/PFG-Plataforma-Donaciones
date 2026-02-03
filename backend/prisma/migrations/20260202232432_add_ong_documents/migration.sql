-- AlterTable
ALTER TABLE "donations" ALTER COLUMN "images" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ongs" ADD COLUMN     "documents" TEXT[] DEFAULT ARRAY[]::TEXT[];
