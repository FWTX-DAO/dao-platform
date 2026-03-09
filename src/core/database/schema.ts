import { text, pgTable, integer, boolean, timestamp, jsonb, primaryKey, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table - syncs with Privy authentication
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  privyDid: text("privy_did").unique().notNull(),
  username: text("username").unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Forum posts table
export const forumPosts = pgTable("forum_posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("General"),
  parentId: text("parent_id").references((): any => forumPosts.id),
  projectId: text("project_id").references((): any => projects.id),
  rootPostId: text("root_post_id").references((): any => forumPosts.id),
  threadDepth: integer("thread_depth").notNull().default(0),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_forum_posts_author_id").on(table.authorId),
  index("idx_forum_posts_parent_id").on(table.parentId),
  index("idx_forum_posts_created_at").on(table.createdAt),
  index("idx_forum_posts_category").on(table.category),
  index("idx_forum_posts_project_id").on(table.projectId),
  index("idx_forum_posts_root_post_id").on(table.rootPostId),
  index("idx_forum_posts_last_activity").on(table.lastActivityAt),
  index("idx_forum_posts_is_pinned").on(table.isPinned),
]);

// Projects table for Civic Innovation Lab
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  githubRepo: text("github_repo").notNull(),
  intent: text("intent").notNull(),
  benefitToFortWorth: text("benefit_to_fort_worth").notNull(),
  status: text("status").default("proposed"),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_projects_creator_id").on(table.creatorId),
  index("idx_projects_status").on(table.status),
  index("idx_projects_created_at").on(table.createdAt),
]);

// Meeting notes table
export const meetingNotes = pgTable("meeting_notes", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  date: text("date").notNull(),
  attendees: text("attendees"),
  agenda: text("agenda"),
  notes: text("notes").notNull(),
  actionItems: text("action_items"),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_meeting_notes_author_id").on(table.authorId),
  index("idx_meeting_notes_date").on(table.date),
]);

// Membership tiers reference table (free, pro, annual)
export const membershipTiers = pgTable("membership_tiers", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull().default(0),
  billingInterval: text("billing_interval").notNull().default("month"),
  features: jsonb("features"),
  stripePriceId: text("stripe_price_id"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_membership_tiers_name").on(table.name),
  index("idx_membership_tiers_stripe_price_id").on(table.stripePriceId),
]);

// Members table for DAO membership
export const members = pgTable("members", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  membershipType: text("membership_type").notNull().default("basic"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  contributionPoints: integer("contribution_points").notNull().default(0),
  votingPower: integer("voting_power").notNull().default(1),
  badges: jsonb("badges"),
  specialRoles: jsonb("special_roles"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

  // Contact / KYC-lite
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  preferredContactMethod: text("preferred_contact_method").default("email"),

  // Career
  employer: text("employer"),
  jobTitle: text("job_title"),
  industry: text("industry"),
  yearsOfExperience: integer("years_of_experience"),

  // Interests
  civicInterests: jsonb("civic_interests"),
  skills: jsonb("skills"),
  availability: text("availability"),

  // Location (Fort Worth focus)
  city: text("city"),
  state: text("state"),
  zip: text("zip"),

  // Social
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  githubUrl: text("github_url"),
  websiteUrl: text("website_url"),

  // Onboarding
  profileCompleteness: integer("profile_completeness").notNull().default(0),
  onboardingStatus: text("onboarding_status").notNull().default("not_started"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),

  // Stripe / Tier
  stripeCustomerId: text("stripe_customer_id"),
  currentTierId: text("current_tier_id").references(() => membershipTiers.id),
}, (table) => [
  index("idx_members_user_id").on(table.userId),
  index("idx_members_status").on(table.status),
  index("idx_members_onboarding_status").on(table.onboardingStatus),
  index("idx_members_city").on(table.city),
  index("idx_members_industry").on(table.industry),
  index("idx_members_stripe_customer_id").on(table.stripeCustomerId),
  index("idx_members_current_tier_id").on(table.currentTierId),
]);

// Subscriptions table for Stripe subscription tracking
export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => members.id),
  tierId: text("tier_id").notNull().references(() => membershipTiers.id),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  status: text("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_subscriptions_member_id").on(table.memberId),
  index("idx_subscriptions_tier_id").on(table.tierId),
  index("idx_subscriptions_stripe_subscription_id").on(table.stripeSubscriptionId),
  index("idx_subscriptions_status").on(table.status),
  index("idx_subscriptions_customer_status").on(table.stripeCustomerId, table.status),
]);

// Payment history table for Stripe webhook records
export const paymentHistory = pgTable("payment_history", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_payment_history_subscription_id").on(table.subscriptionId),
  index("idx_payment_history_status").on(table.status),
]);

// RBAC: Roles table
export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").unique().notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  level: integer("level").notNull().default(0),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_roles_name").on(table.name),
  index("idx_roles_level").on(table.level),
]);

// RBAC: Permissions table
export const permissions = pgTable("permissions", {
  id: text("id").primaryKey(),
  resource: text("resource").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_permissions_resource_action").on(table.resource, table.action),
]);

// RBAC: Role-Permission junction table
export const rolePermissions = pgTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id),
  permissionId: text("permission_id").notNull().references(() => permissions.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
  index("idx_role_permissions_role_id").on(table.roleId),
  index("idx_role_permissions_permission_id").on(table.permissionId),
]);

// RBAC: Member-Role junction table (supports multiple roles per member)
export const memberRoles = pgTable("member_roles", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => members.id),
  roleId: text("role_id").notNull().references(() => roles.id),
  grantedBy: text("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_member_roles_member_id").on(table.memberId),
  index("idx_member_roles_role_id").on(table.roleId),
  index("idx_member_roles_member_role").on(table.memberId, table.roleId),
  index("idx_member_roles_is_active").on(table.isActive),
]);

// Unified member activity tracking
export const memberActivities = pgTable("member_activities", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => members.id),
  activityType: text("activity_type").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  metadata: jsonb("metadata"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_member_activities_member_id").on(table.memberId),
  index("idx_member_activities_activity_type").on(table.activityType),
  index("idx_member_activities_created_at").on(table.createdAt),
  index("idx_member_activities_member_type").on(table.memberId, table.activityType),
  index("idx_member_activities_member_created").on(table.memberId, table.createdAt),
  index("idx_member_activities_resource").on(table.resourceType, table.resourceId),
]);

// Project collaborators junction table
export const projectCollaborators = pgTable("project_collaborators", {
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").default("contributor"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.userId] }),
  index("idx_project_collaborators_project_id").on(table.projectId),
  index("idx_project_collaborators_user_id").on(table.userId),
]);

// Project updates table for tracking progress and announcements
export const projectUpdates = pgTable("project_updates", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updateType: text("update_type").default("general"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Forum votes table
export const forumVotes = pgTable("forum_votes", {
  postId: text("post_id").notNull().references(() => forumPosts.id),
  userId: text("user_id").notNull().references(() => users.id),
  voteType: integer("vote_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.userId] }),
  index("idx_forum_votes_post_id").on(table.postId),
  index("idx_forum_votes_user_id").on(table.userId),
]);

// Documents table for IPFS file management
export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  uploaderId: text("uploader_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("General"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  pinataId: text("pinata_id").notNull(),
  cid: text("cid").notNull(),
  network: text("network").notNull().default("private"),
  groupId: text("group_id"),
  keyvalues: jsonb("keyvalues"),
  status: text("status").notNull().default("active"),
  isPublic: boolean("is_public").notNull().default(false),
  tags: text("tags"),
  accessCount: integer("access_count").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_documents_uploader_id").on(table.uploaderId),
  index("idx_documents_status").on(table.status),
  index("idx_documents_category").on(table.category),
]);

// Document audit trail table for tracking changes and access
export const documentAuditTrail = pgTable("document_audit_trail", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_document_audit_trail_document_id").on(table.documentId),
  index("idx_document_audit_trail_user_id").on(table.userId),
  index("idx_document_audit_trail_timestamp").on(table.timestamp),
]);

// Document shares table for tracking shared access
export const documentShares = pgTable("document_shares", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  sharedById: text("shared_by_id").notNull().references(() => users.id),
  sharedWithId: text("shared_with_id").references(() => users.id),
  shareType: text("share_type").notNull().default("view"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_document_shares_document_id").on(table.documentId),
  index("idx_document_shares_shared_by_id").on(table.sharedById),
  index("idx_document_shares_shared_with_id").on(table.sharedWithId),
]);

// Innovation Bounties table
export const innovationBounties = pgTable("innovation_bounties", {
  id: text("id").primaryKey(),

  // Organization Info
  organizationName: text("organization_name").notNull(),
  organizationType: text("organization_type").notNull(),
  organizationContact: text("organization_contact"),
  organizationWebsite: text("organization_website"),

  // Sponsor Information
  sponsorFirstName: text("sponsor_first_name"),
  sponsorLastName: text("sponsor_last_name"),
  sponsorEmail: text("sponsor_email"),
  sponsorPhone: text("sponsor_phone"),
  sponsorTitle: text("sponsor_title"),
  sponsorDepartment: text("sponsor_department"),
  sponsorLinkedIn: text("sponsor_linkedin"),

  // Organization Details
  organizationSize: text("organization_size"),
  organizationIndustry: text("organization_industry"),
  organizationAddress: text("organization_address"),
  organizationCity: text("organization_city"),
  organizationState: text("organization_state"),
  organizationZip: text("organization_zip"),

  // Bounty Details
  title: text("title").notNull(),
  problemStatement: text("problem_statement").notNull(),
  useCase: text("use_case").notNull(),
  currentState: text("current_state"),
  commonToolsUsed: text("common_tools_used"),
  desiredOutcome: text("desired_outcome").notNull(),

  // Technical Requirements
  technicalRequirements: jsonb("technical_requirements"),
  constraints: text("constraints"),
  deliverables: text("deliverables"),

  // Bounty Metadata
  bountyAmount: integer("bounty_amount"),
  bountyType: text("bounty_type").default("fixed"),
  deadline: timestamp("deadline", { withTimezone: true }),
  category: text("category"),
  tags: text("tags"),

  // Status & Screening
  status: text("status").default("draft"),
  screeningNotes: text("screening_notes"),
  screenedBy: text("screened_by").references(() => users.id),
  screenedAt: timestamp("screened_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),

  // Submission & Ownership
  submitterId: text("submitter_id").notNull().references(() => users.id),
  isAnonymous: boolean("is_anonymous").notNull().default(false),

  // Metrics
  viewCount: integer("view_count").notNull().default(0),
  proposalCount: integer("proposal_count").notNull().default(0),

  // Submission Attribution
  submissionSource: text("submission_source").notNull().default("platform"),
  submitterEmail: text("submitter_email"),
  submitterIp: text("submitter_ip"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_innovation_bounties_submitter_id").on(table.submitterId),
  index("idx_innovation_bounties_status").on(table.status),
  index("idx_innovation_bounties_category").on(table.category),
  index("idx_innovation_bounties_created_at").on(table.createdAt),
  index("idx_innovation_bounties_submission_source").on(table.submissionSource),
]);

// Bounty Proposals table (links projects to bounties)
export const bountyProposals = pgTable("bounty_proposals", {
  id: text("id").primaryKey(),
  bountyId: text("bounty_id").notNull().references(() => innovationBounties.id),
  projectId: text("project_id").references(() => projects.id),
  proposerId: text("proposer_id").notNull().references(() => users.id),

  // Proposal Details
  proposalTitle: text("proposal_title").notNull(),
  proposalDescription: text("proposal_description").notNull(),
  approach: text("approach").notNull(),
  timeline: text("timeline"),
  budget: text("budget"),
  teamMembers: jsonb("team_members"),

  // Status
  status: text("status").default("submitted"),
  reviewNotes: text("review_notes"),
  reviewedBy: text("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_bounty_proposals_bounty_id").on(table.bountyId),
  index("idx_bounty_proposals_proposer_id").on(table.proposerId),
  index("idx_bounty_proposals_project_id").on(table.projectId),
  index("idx_bounty_proposals_status").on(table.status),
]);

// Bounty Comments table for discussion
export const bountyComments = pgTable("bounty_comments", {
  id: text("id").primaryKey(),
  bountyId: text("bounty_id").notNull().references(() => innovationBounties.id),
  authorId: text("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: text("parent_id").references((): any => bountyComments.id),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_bounty_comments_bounty_id").on(table.bountyId),
  index("idx_bounty_comments_parent_id").on(table.parentId),
  index("idx_bounty_comments_author_id").on(table.authorId),
]);

// Passport stamps for event attendance tracking
export const passportStamps = pgTable("passport_stamps", {
  id: text("id").primaryKey(),
  memberId: text("member_id").notNull().references(() => members.id),
  eventName: text("event_name").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }),
  eventType: text("event_type").notNull(),
  description: text("description"),
  issuedBy: text("issued_by").references(() => users.id),
  pointsAwarded: integer("points_awarded").notNull().default(5),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_passport_stamps_member_id").on(table.memberId),
  index("idx_passport_stamps_event_type").on(table.eventType),
  index("idx_passport_stamps_member_created").on(table.memberId, table.createdAt),
]);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  forumPosts: many(forumPosts),
  projects: many(projects),
  meetingNotes: many(meetingNotes),
  projectCollaborations: many(projectCollaborators),
  votes: many(forumVotes),
  documents: many(documents),
  documentAuditTrail: many(documentAuditTrail),
  documentSharesGiven: many(documentShares, { relationName: "SharedBy" }),
  documentSharesReceived: many(documentShares, { relationName: "SharedWith" }),
  membership: one(members, {
    fields: [users.id],
    references: [members.userId],
  }),
  roleGrants: many(memberRoles),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
  }),
  parent: one(forumPosts, {
    fields: [forumPosts.parentId],
    references: [forumPosts.id],
    relationName: "ParentPost",
  }),
  rootPost: one(forumPosts, {
    fields: [forumPosts.rootPostId],
    references: [forumPosts.id],
    relationName: "RootPost",
  }),
  project: one(projects, {
    fields: [forumPosts.projectId],
    references: [projects.id],
  }),
  replies: many(forumPosts, { relationName: "ParentPost" }),
  votes: many(forumVotes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  collaborators: many(projectCollaborators),
  updates: many(projectUpdates),
  forumPosts: many(forumPosts),
}));

export const meetingNotesRelations = relations(meetingNotes, ({ one }) => ({
  author: one(users, {
    fields: [meetingNotes.authorId],
    references: [users.id],
  }),
}));

export const projectCollaboratorsRelations = relations(projectCollaborators, ({ one }) => ({
  project: one(projects, {
    fields: [projectCollaborators.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectCollaborators.userId],
    references: [users.id],
  }),
}));

export const forumVotesRelations = relations(forumVotes, ({ one }) => ({
  post: one(forumPosts, {
    fields: [forumVotes.postId],
    references: [forumPosts.id],
  }),
  user: one(users, {
    fields: [forumVotes.userId],
    references: [users.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
  currentTier: one(membershipTiers, {
    fields: [members.currentTierId],
    references: [membershipTiers.id],
  }),
  subscriptions: many(subscriptions),
  memberRoles: many(memberRoles),
  activities: many(memberActivities),
  stamps: many(passportStamps),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
  author: one(users, {
    fields: [projectUpdates.authorId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  uploader: one(users, {
    fields: [documents.uploaderId],
    references: [users.id],
  }),
  auditTrail: many(documentAuditTrail),
  shares: many(documentShares),
}));

export const documentAuditTrailRelations = relations(documentAuditTrail, ({ one }) => ({
  document: one(documents, {
    fields: [documentAuditTrail.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentAuditTrail.userId],
    references: [users.id],
  }),
}));

export const documentSharesRelations = relations(documentShares, ({ one }) => ({
  document: one(documents, {
    fields: [documentShares.documentId],
    references: [documents.id],
  }),
  sharedBy: one(users, {
    fields: [documentShares.sharedById],
    references: [users.id],
    relationName: "SharedBy",
  }),
  sharedWith: one(users, {
    fields: [documentShares.sharedWithId],
    references: [users.id],
    relationName: "SharedWith",
  }),
}));

export const innovationBountiesRelations = relations(innovationBounties, ({ one, many }) => ({
  submitter: one(users, {
    fields: [innovationBounties.submitterId],
    references: [users.id],
    relationName: "BountySubmitter",
  }),
  screener: one(users, {
    fields: [innovationBounties.screenedBy],
    references: [users.id],
    relationName: "BountyScreener",
  }),
  proposals: many(bountyProposals),
  comments: many(bountyComments),
}));

export const bountyProposalsRelations = relations(bountyProposals, ({ one }) => ({
  bounty: one(innovationBounties, {
    fields: [bountyProposals.bountyId],
    references: [innovationBounties.id],
  }),
  project: one(projects, {
    fields: [bountyProposals.projectId],
    references: [projects.id],
  }),
  proposer: one(users, {
    fields: [bountyProposals.proposerId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [bountyProposals.reviewedBy],
    references: [users.id],
  }),
}));

export const bountyCommentsRelations = relations(bountyComments, ({ one, many }) => ({
  bounty: one(innovationBounties, {
    fields: [bountyComments.bountyId],
    references: [innovationBounties.id],
  }),
  author: one(users, {
    fields: [bountyComments.authorId],
    references: [users.id],
  }),
  parent: one(bountyComments, {
    fields: [bountyComments.parentId],
    references: [bountyComments.id],
  }),
  replies: many(bountyComments),
}));

// Membership tiers relations
export const membershipTiersRelations = relations(membershipTiers, ({ many }) => ({
  subscriptions: many(subscriptions),
  members: many(members),
}));

// Subscriptions relations
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  member: one(members, {
    fields: [subscriptions.memberId],
    references: [members.id],
  }),
  tier: one(membershipTiers, {
    fields: [subscriptions.tierId],
    references: [membershipTiers.id],
  }),
  payments: many(paymentHistory),
}));

// Payment history relations
export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [paymentHistory.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// Roles relations
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  memberRoles: many(memberRoles),
}));

// Permissions relations
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

// Role permissions relations
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// Member roles relations
export const memberRolesRelations = relations(memberRoles, ({ one }) => ({
  member: one(members, {
    fields: [memberRoles.memberId],
    references: [members.id],
  }),
  role: one(roles, {
    fields: [memberRoles.roleId],
    references: [roles.id],
  }),
  grantedByUser: one(users, {
    fields: [memberRoles.grantedBy],
    references: [users.id],
  }),
}));

// Member activities relations
export const memberActivitiesRelations = relations(memberActivities, ({ one }) => ({
  member: one(members, {
    fields: [memberActivities.memberId],
    references: [members.id],
  }),
}));

// Passport stamps relations
export const passportStampsRelations = relations(passportStamps, ({ one }) => ({
  member: one(members, {
    fields: [passportStamps.memberId],
    references: [members.id],
  }),
  issuer: one(users, {
    fields: [passportStamps.issuedBy],
    references: [users.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type ForumPost = InferSelectModel<typeof forumPosts>;
export type NewForumPost = InferInsertModel<typeof forumPosts>;
export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
export type MeetingNote = InferSelectModel<typeof meetingNotes>;
export type NewMeetingNote = InferInsertModel<typeof meetingNotes>;
export type Member = InferSelectModel<typeof members>;
export type NewMember = InferInsertModel<typeof members>;
export type ProjectCollaborator = InferSelectModel<typeof projectCollaborators>;
export type ProjectUpdate = InferSelectModel<typeof projectUpdates>;
export type NewProjectUpdate = InferInsertModel<typeof projectUpdates>;
export type ForumVote = InferSelectModel<typeof forumVotes>;
export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;
export type DocumentAuditTrail = InferSelectModel<typeof documentAuditTrail>;
export type NewDocumentAuditTrail = InferInsertModel<typeof documentAuditTrail>;
export type DocumentShare = InferSelectModel<typeof documentShares>;
export type NewDocumentShare = InferInsertModel<typeof documentShares>;
export type InnovationBounty = InferSelectModel<typeof innovationBounties>;
export type NewInnovationBounty = InferInsertModel<typeof innovationBounties>;
export type BountyProposal = InferSelectModel<typeof bountyProposals>;
export type NewBountyProposal = InferInsertModel<typeof bountyProposals>;
export type BountyComment = InferSelectModel<typeof bountyComments>;
export type NewBountyComment = InferInsertModel<typeof bountyComments>;

// Membership & Subscription types
export type MembershipTier = InferSelectModel<typeof membershipTiers>;
export type NewMembershipTier = InferInsertModel<typeof membershipTiers>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type PaymentHistoryRecord = InferSelectModel<typeof paymentHistory>;
export type NewPaymentHistoryRecord = InferInsertModel<typeof paymentHistory>;

// RBAC types
export type Role = InferSelectModel<typeof roles>;
export type NewRole = InferInsertModel<typeof roles>;
export type Permission = InferSelectModel<typeof permissions>;
export type NewPermission = InferInsertModel<typeof permissions>;
export type RolePermission = InferSelectModel<typeof rolePermissions>;
export type NewRolePermission = InferInsertModel<typeof rolePermissions>;
export type MemberRole = InferSelectModel<typeof memberRoles>;
export type NewMemberRole = InferInsertModel<typeof memberRoles>;

// Activity types
export type MemberActivity = InferSelectModel<typeof memberActivities>;
export type NewMemberActivity = InferInsertModel<typeof memberActivities>;

// Passport stamps types
export type PassportStampRecord = InferSelectModel<typeof passportStamps>;
export type NewPassportStampRecord = InferInsertModel<typeof passportStamps>;
