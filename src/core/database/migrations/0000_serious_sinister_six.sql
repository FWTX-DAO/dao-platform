CREATE TABLE "bounty_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"bounty_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" text,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bounty_proposals" (
	"id" text PRIMARY KEY NOT NULL,
	"bounty_id" text NOT NULL,
	"project_id" text,
	"proposer_id" text NOT NULL,
	"proposal_title" text NOT NULL,
	"proposal_description" text NOT NULL,
	"approach" text NOT NULL,
	"timeline" text,
	"budget" text,
	"team_members" jsonb,
	"status" text DEFAULT 'submitted',
	"review_notes" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_audit_trail" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_shares" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"shared_by_id" text NOT NULL,
	"shared_with_id" text,
	"share_type" text DEFAULT 'view' NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"uploader_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'General',
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"pinata_id" text NOT NULL,
	"cid" text NOT NULL,
	"network" text DEFAULT 'private' NOT NULL,
	"group_id" text,
	"keyvalues" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"tags" text,
	"access_count" integer DEFAULT 0 NOT NULL,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'General',
	"parent_id" text,
	"project_id" text,
	"root_post_id" text,
	"thread_depth" integer DEFAULT 0 NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_votes" (
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"vote_type" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_votes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "innovation_bounties" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_name" text NOT NULL,
	"organization_type" text NOT NULL,
	"organization_contact" text,
	"organization_website" text,
	"sponsor_first_name" text,
	"sponsor_last_name" text,
	"sponsor_email" text,
	"sponsor_phone" text,
	"sponsor_title" text,
	"sponsor_department" text,
	"sponsor_linkedin" text,
	"organization_size" text,
	"organization_industry" text,
	"organization_address" text,
	"organization_city" text,
	"organization_state" text,
	"organization_zip" text,
	"title" text NOT NULL,
	"problem_statement" text NOT NULL,
	"use_case" text NOT NULL,
	"current_state" text,
	"common_tools_used" text,
	"desired_outcome" text NOT NULL,
	"technical_requirements" jsonb,
	"constraints" text,
	"deliverables" text,
	"bounty_amount" integer,
	"bounty_type" text DEFAULT 'fixed',
	"deadline" timestamp with time zone,
	"category" text,
	"tags" text,
	"status" text DEFAULT 'draft',
	"screening_notes" text,
	"screened_by" text,
	"screened_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"submitter_id" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"proposal_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"attendees" text,
	"agenda" text,
	"notes" text NOT NULL,
	"action_items" text,
	"tags" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"activity_type" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"metadata" jsonb,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"role_id" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"membership_type" text DEFAULT 'basic' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"contribution_points" integer DEFAULT 0 NOT NULL,
	"voting_power" integer DEFAULT 1 NOT NULL,
	"badges" jsonb,
	"special_roles" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text,
	"phone" text,
	"preferred_contact_method" text DEFAULT 'email',
	"employer" text,
	"job_title" text,
	"industry" text,
	"years_of_experience" integer,
	"civic_interests" jsonb,
	"skills" jsonb,
	"availability" text,
	"city" text,
	"state" text,
	"zip" text,
	"linkedin_url" text,
	"twitter_url" text,
	"github_url" text,
	"website_url" text,
	"profile_completeness" integer DEFAULT 0 NOT NULL,
	"onboarding_status" text DEFAULT 'not_started' NOT NULL,
	"terms_accepted_at" timestamp with time zone,
	"stripe_customer_id" text,
	"current_tier_id" text,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"billing_interval" text DEFAULT 'month' NOT NULL,
	"features" jsonb,
	"stripe_price_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "passport_stamps" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"event_name" text NOT NULL,
	"event_date" timestamp with time zone,
	"event_type" text NOT NULL,
	"description" text,
	"issued_by" text,
	"points_awarded" integer DEFAULT 5 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"paid_at" timestamp with time zone,
	"failure_reason" text,
	"receipt_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_history_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_collaborators" (
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'contributor',
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_collaborators_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"update_type" text DEFAULT 'general',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"github_repo" text NOT NULL,
	"intent" text NOT NULL,
	"benefit_to_fort_worth" text NOT NULL,
	"status" text DEFAULT 'proposed',
	"tags" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"level" integer DEFAULT 0 NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"cancel_reason" text,
	"trial_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"privy_did" text NOT NULL,
	"username" text,
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_privy_did_unique" UNIQUE("privy_did")
);
--> statement-breakpoint
ALTER TABLE "bounty_comments" ADD CONSTRAINT "bounty_comments_bounty_id_innovation_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."innovation_bounties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_comments" ADD CONSTRAINT "bounty_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_comments" ADD CONSTRAINT "bounty_comments_parent_id_bounty_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."bounty_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_proposals" ADD CONSTRAINT "bounty_proposals_bounty_id_innovation_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."innovation_bounties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_proposals" ADD CONSTRAINT "bounty_proposals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_proposals" ADD CONSTRAINT "bounty_proposals_proposer_id_users_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_proposals" ADD CONSTRAINT "bounty_proposals_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_trail" ADD CONSTRAINT "document_audit_trail_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_trail" ADD CONSTRAINT "document_audit_trail_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_by_id_users_id_fk" FOREIGN KEY ("shared_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_shared_with_id_users_id_fk" FOREIGN KEY ("shared_with_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_parent_id_forum_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forum_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_root_post_id_forum_posts_id_fk" FOREIGN KEY ("root_post_id") REFERENCES "public"."forum_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_votes" ADD CONSTRAINT "forum_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovation_bounties" ADD CONSTRAINT "innovation_bounties_screened_by_users_id_fk" FOREIGN KEY ("screened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "innovation_bounties" ADD CONSTRAINT "innovation_bounties_submitter_id_users_id_fk" FOREIGN KEY ("submitter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_activities" ADD CONSTRAINT "member_activities_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_roles" ADD CONSTRAINT "member_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_current_tier_id_membership_tiers_id_fk" FOREIGN KEY ("current_tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport_stamps" ADD CONSTRAINT "passport_stamps_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passport_stamps" ADD CONSTRAINT "passport_stamps_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_collaborators" ADD CONSTRAINT "project_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bounty_comments_bounty_id" ON "bounty_comments" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "idx_bounty_comments_parent_id" ON "bounty_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_bounty_comments_author_id" ON "bounty_comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_bounty_proposals_bounty_id" ON "bounty_proposals" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "idx_bounty_proposals_proposer_id" ON "bounty_proposals" USING btree ("proposer_id");--> statement-breakpoint
CREATE INDEX "idx_bounty_proposals_project_id" ON "bounty_proposals" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_bounty_proposals_status" ON "bounty_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_document_audit_trail_document_id" ON "document_audit_trail" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_audit_trail_user_id" ON "document_audit_trail" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_document_audit_trail_timestamp" ON "document_audit_trail" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_document_shares_document_id" ON "document_shares" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "idx_document_shares_shared_by_id" ON "document_shares" USING btree ("shared_by_id");--> statement-breakpoint
CREATE INDEX "idx_document_shares_shared_with_id" ON "document_shares" USING btree ("shared_with_id");--> statement-breakpoint
CREATE INDEX "idx_documents_uploader_id" ON "documents" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "idx_documents_status" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_documents_category" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_author_id" ON "forum_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_parent_id" ON "forum_posts" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_created_at" ON "forum_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_category" ON "forum_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_project_id" ON "forum_posts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_root_post_id" ON "forum_posts" USING btree ("root_post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_last_activity" ON "forum_posts" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_forum_posts_is_pinned" ON "forum_posts" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX "idx_forum_votes_post_id" ON "forum_votes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_forum_votes_user_id" ON "forum_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_innovation_bounties_submitter_id" ON "innovation_bounties" USING btree ("submitter_id");--> statement-breakpoint
CREATE INDEX "idx_innovation_bounties_status" ON "innovation_bounties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_innovation_bounties_category" ON "innovation_bounties" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_innovation_bounties_created_at" ON "innovation_bounties" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_meeting_notes_author_id" ON "meeting_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_meeting_notes_date" ON "meeting_notes" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_member_activities_member_id" ON "member_activities" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_activities_activity_type" ON "member_activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_member_activities_created_at" ON "member_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_member_activities_member_type" ON "member_activities" USING btree ("member_id","activity_type");--> statement-breakpoint
CREATE INDEX "idx_member_activities_member_created" ON "member_activities" USING btree ("member_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_member_activities_resource" ON "member_activities" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "idx_member_roles_member_id" ON "member_roles" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_member_roles_role_id" ON "member_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_member_roles_member_role" ON "member_roles" USING btree ("member_id","role_id");--> statement-breakpoint
CREATE INDEX "idx_member_roles_is_active" ON "member_roles" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_members_user_id" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_members_status" ON "members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_members_onboarding_status" ON "members" USING btree ("onboarding_status");--> statement-breakpoint
CREATE INDEX "idx_members_city" ON "members" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_members_industry" ON "members" USING btree ("industry");--> statement-breakpoint
CREATE INDEX "idx_members_stripe_customer_id" ON "members" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_members_current_tier_id" ON "members" USING btree ("current_tier_id");--> statement-breakpoint
CREATE INDEX "idx_membership_tiers_name" ON "membership_tiers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_membership_tiers_stripe_price_id" ON "membership_tiers" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "idx_passport_stamps_member_id" ON "passport_stamps" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_passport_stamps_event_type" ON "passport_stamps" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_passport_stamps_member_created" ON "passport_stamps" USING btree ("member_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_payment_history_subscription_id" ON "payment_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_payment_history_status" ON "payment_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_permissions_resource_action" ON "permissions" USING btree ("resource","action");--> statement-breakpoint
CREATE INDEX "idx_project_collaborators_project_id" ON "project_collaborators" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_project_collaborators_user_id" ON "project_collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_projects_creator_id" ON "projects" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_projects_created_at" ON "projects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_roles_name" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_roles_level" ON "roles" USING btree ("level");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_member_id" ON "subscriptions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_tier_id" ON "subscriptions" USING btree ("tier_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_stripe_subscription_id" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_customer_status" ON "subscriptions" USING btree ("stripe_customer_id","status");