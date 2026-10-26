CREATE TABLE "referral_codes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_id" text NOT NULL,
	"source_key" text NOT NULL,
	"kind" text NOT NULL,
	"points" integer NOT NULL,
	"amount_cents" integer,
	"stripe_invoice_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_rewards_source_key_unique" UNIQUE("source_key"),
	CONSTRAINT "referral_rewards_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_member_id" text NOT NULL,
	"referred_member_id" text NOT NULL,
	"referred_email_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referred_member_id_unique" UNIQUE("referred_member_id"),
	CONSTRAINT "referrals_referred_email_hash_unique" UNIQUE("referred_email_hash"),
	CONSTRAINT "referrals_no_self_referral" CHECK ("referrals"."referrer_member_id" <> "referrals"."referred_member_id")
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_history" ADD COLUMN "stripe_invoice_id" text;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_member_id_members_id_fk" FOREIGN KEY ("referrer_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_member_id_members_id_fk" FOREIGN KEY ("referred_member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_referral_rewards_referral" ON "referral_rewards" USING btree ("referral_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_referrer" ON "referrals" USING btree ("referrer_member_id");--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id");--> statement-breakpoint
-- Existing incomplete identities must finish email onboarding again.
UPDATE "members" SET "onboarding_status" = 'not_started', "updated_at" = now() WHERE "onboarding_status" = 'completed' AND ("email" IS NULL OR length(btrim("email")) = 0);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_completed_email_check" CHECK ("members"."onboarding_status" <> 'completed' OR ("members"."email" IS NOT NULL AND length(btrim("members"."email")) > 0));
--> statement-breakpoint
-- Every existing user receives a stable public invitation code.
INSERT INTO "referral_codes" ("user_id", "code") SELECT "id", upper(replace(gen_random_uuid()::text, '-', '')) FROM "users";
