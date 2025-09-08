-- AlterTable
ALTER TABLE "families" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "family_member_permissions" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "family_member_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "granted_by" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_member_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_member_permissions_family_member_id_permission_key" ON "family_member_permissions"("family_member_id", "permission");

-- AddForeignKey
ALTER TABLE "family_member_permissions" ADD CONSTRAINT "family_member_permissions_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "family_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
