/*
  Warnings:

  - Added the required column `sync_batch_id` to the `raw_sms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "raw_sms" ADD COLUMN     "discard_reason" TEXT,
ADD COLUMN     "is_relevant" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "processed_at" TIMESTAMP(3),
ADD COLUMN     "sync_batch_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "sync_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_scanned" INTEGER NOT NULL DEFAULT 0,
    "new_stored" INTEGER NOT NULL DEFAULT 0,
    "duplicates_skipped" INTEGER NOT NULL DEFAULT 0,
    "irrelevant_discarded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "sync_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_sessions_user_id_started_at_idx" ON "sync_sessions"("user_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "raw_sms_user_id_sms_timestamp_idx" ON "raw_sms"("user_id", "sms_timestamp" DESC);

-- CreateIndex
CREATE INDEX "raw_sms_processed_at_idx" ON "raw_sms"("processed_at");

-- AddForeignKey
ALTER TABLE "raw_sms" ADD CONSTRAINT "raw_sms_sync_batch_id_fkey" FOREIGN KEY ("sync_batch_id") REFERENCES "sync_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_sessions" ADD CONSTRAINT "sync_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
