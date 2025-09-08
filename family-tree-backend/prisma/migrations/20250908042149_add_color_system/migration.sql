-- AlterTable
ALTER TABLE "members" ADD COLUMN     "color" TEXT,
ADD COLUMN     "parent_colors" TEXT[] DEFAULT ARRAY[]::TEXT[];
