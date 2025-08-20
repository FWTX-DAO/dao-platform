import { sql } from "drizzle-orm";
import { text, sqliteTable, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users table - syncs with Privy authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Using text for UUID-like IDs
  privyDid: text("privy_did").unique().notNull(), // Privy's decentralized ID
  username: text("username"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Forum posts table
export const forumPosts = sqliteTable("forum_posts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").default("General"),
  parentId: text("parent_id").references((): any => forumPosts.id), // Self-reference for replies
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Projects table for Civic Innovation Lab
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  githubRepo: text("github_repo").notNull(),
  intent: text("intent").notNull(),
  benefitToFortWorth: text("benefit_to_fort_worth").notNull(),
  status: text("status").default("proposed"), // proposed, active, completed
  tags: text("tags"), // Comma-separated tags
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Meeting notes table
export const meetingNotes = sqliteTable("meeting_notes", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  date: text("date").notNull(), // SQLite doesn't have native date type
  attendees: text("attendees"), // Comma-separated attendees
  agenda: text("agenda"),
  notes: text("notes").notNull(),
  actionItems: text("action_items"), // Newline-separated action items
  tags: text("tags"), // Comma-separated tags
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Members table for DAO membership
export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id).unique(),
  membershipType: text("membership_type").notNull().default("basic"), // basic, contributor, council
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"), // For membership expiration if needed
  contributionPoints: integer("contribution_points").notNull().default(0),
  votingPower: integer("voting_power").notNull().default(1),
  badges: text("badges"), // JSON array of earned badges
  specialRoles: text("special_roles"), // JSON array of special roles
  status: text("status").notNull().default("active"), // active, inactive, suspended
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Project collaborators junction table
export const projectCollaborators = sqliteTable("project_collaborators", {
  projectId: text("project_id").notNull().references(() => projects.id),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").default("contributor"),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: primaryKey({ columns: [table.projectId, table.userId] }),
}));

// Project updates table for tracking progress and announcements
export const projectUpdates = sqliteTable("project_updates", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  authorId: text("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updateType: text("update_type").default("general"), // general, milestone, announcement, issue
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Forum votes table
export const forumVotes = sqliteTable("forum_votes", {
  postId: text("post_id").notNull().references(() => forumPosts.id),
  userId: text("user_id").notNull().references(() => users.id),
  voteType: integer("vote_type").notNull(), // 1 for upvote, -1 for downvote
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
}));

// Documents table for IPFS file management
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  uploaderId: text("uploader_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("General"),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  pinataId: text("pinata_id").notNull().unique(), // Pinata file ID
  cid: text("cid").notNull(), // IPFS content identifier
  network: text("network").notNull().default("private"), // "public" or "private"
  groupId: text("group_id"), // Pinata group ID for organization
  keyvalues: text("keyvalues"), // JSON string for metadata key-value pairs
  status: text("status").notNull().default("active"), // active, archived, deleted
  isPublic: integer("is_public").notNull().default(0), // Boolean as integer (0/1)
  tags: text("tags"), // Comma-separated tags
  accessCount: integer("access_count").notNull().default(0),
  lastAccessedAt: text("last_accessed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Document audit trail table for tracking changes and access
export const documentAuditTrail = sqliteTable("document_audit_trail", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // uploaded, updated, accessed, deleted, shared, downloaded
  metadata: text("metadata"), // JSON string for additional action-specific data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Document shares table for tracking shared access
export const documentShares = sqliteTable("document_shares", {
  id: text("id").primaryKey(),
  documentId: text("document_id").notNull().references(() => documents.id),
  sharedById: text("shared_by_id").notNull().references(() => users.id),
  sharedWithId: text("shared_with_id").references(() => users.id), // null for public shares
  shareType: text("share_type").notNull().default("view"), // view, edit, admin
  expiresAt: text("expires_at"), // Optional expiration
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Define relations for better query support
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
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [forumPosts.authorId],
    references: [users.id],
  }),
  parent: one(forumPosts, {
    fields: [forumPosts.parentId],
    references: [forumPosts.id],
  }),
  replies: many(forumPosts),
  votes: many(forumVotes),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  collaborators: many(projectCollaborators),
  updates: many(projectUpdates),
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

export const membersRelations = relations(members, ({ one }) => ({
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
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

// Type exports for TypeScript
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