-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "raw_sms_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "direction" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "merchant" TEXT,
    "sender" TEXT NOT NULL,
    "sms_timestamp" TIMESTAMP(3) NOT NULL,
    "parsed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION NOT NULL,
    "raw_body" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_raw_sms_id_key" ON "transactions"("raw_sms_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_sms_timestamp_idx" ON "transactions"("user_id", "sms_timestamp" DESC);

-- CreateIndex
CREATE INDEX "transactions_user_id_category_idx" ON "transactions"("user_id", "category");

-- CreateIndex
CREATE INDEX "transactions_direction_idx" ON "transactions"("direction");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_raw_sms_id_fkey" FOREIGN KEY ("raw_sms_id") REFERENCES "raw_sms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
