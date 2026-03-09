ALTER TABLE "innovation_bounties" ADD COLUMN "submission_source" text DEFAULT 'platform' NOT NULL;--> statement-breakpoint
ALTER TABLE "innovation_bounties" ADD COLUMN "submitter_email" text;--> statement-breakpoint
ALTER TABLE "innovation_bounties" ADD COLUMN "submitter_ip" text;--> statement-breakpoint
CREATE INDEX "idx_innovation_bounties_submission_source" ON "innovation_bounties" USING btree ("submission_source");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");