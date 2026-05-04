CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "email" varchar(255) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "display_name" varchar(100),
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "type" varchar(20),
  "color" varchar(7),
  "is_default" boolean DEFAULT false,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "category_id" uuid,
  "amount" decimal(12,2) NOT NULL,
  "type" varchar(20) NOT NULL,
  "description" varchar(500),
  "transaction_date" date NOT NULL,
  "ai_categorized" boolean DEFAULT false,
  "ai_confidence" decimal(3,2),
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp DEFAULT (now())
);

CREATE TABLE "budgets" (
  "id" uuid PRIMARY KEY DEFAULT (gen_random_uuid()),
  "user_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "amount" decimal(12,2) NOT NULL,
  "period" varchar(20),
  "start_date" date NOT NULL,
  "end_date" date,
  "created_at" timestamp DEFAULT (now())
);

CREATE UNIQUE INDEX ON "categories" ("user_id", "name");

CREATE INDEX ON "transactions" ("user_id", "transaction_date");

CREATE INDEX ON "transactions" ("user_id");

COMMENT ON COLUMN "categories"."type" IS 'income or expense';

COMMENT ON COLUMN "categories"."color" IS 'hex color';

COMMENT ON COLUMN "transactions"."type" IS 'income or expense';

COMMENT ON COLUMN "transactions"."ai_confidence" IS '0.00 to 1.00';

COMMENT ON COLUMN "budgets"."period" IS 'monthly, yearly';

ALTER TABLE "categories" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budgets" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budgets" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;
