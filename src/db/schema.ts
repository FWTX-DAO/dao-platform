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

// Define relations for better query support
export const usersRelations = relations(users, ({ one, many }) => ({
  forumPosts: many(forumPosts),
  projects: many(projects),
  meetingNotes: many(meetingNotes),
  projectCollaborations: many(projectCollaborators),
  votes: many(forumVotes),
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