/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `donations` table. All the data in the column will be lost.
  - Added the required column `city` to the `donations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "donations" DROP COLUMN "imageUrl",
DROP COLUMN "location",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT;
