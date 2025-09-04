-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_member_id_fkey" FOREIGN KEY ("related_member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
