/*
  Warnings:

  - You are about to drop the column `documents` on the `ongs` table. All the data in the column will be lost.
  - Los documentos existentes en el sistema de archivos necesitarán ser re-subidos por las ONGs.

*/
-- CreateTable primero (antes de eliminar la columna documents)
CREATE TABLE "ong_documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ongId" TEXT NOT NULL,

    CONSTRAINT "ong_documents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ong_documents" ADD CONSTRAINT "ong_documents_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ongs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (eliminar columna antigua después de crear la nueva tabla)
ALTER TABLE "ongs" DROP COLUMN "documents";
