import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
  users,
  forumPosts,
  projects,
  meetingNotes,
  members,
  projectCollaborators,
  projectUpdates,
  forumVotes,
  documents,
  documentAuditTrail,
  documentShares,
  innovationBounties,
  bountyProposals,
  bountyComments,
} from '../../core/database/schema';

export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type ForumPost = InferSelectModel<typeof forumPosts>;
export type InsertForumPost = InferInsertModel<typeof forumPosts>;

export type Project = InferSelectModel<typeof projects>;
export type InsertProject = InferInsertModel<typeof projects>;

export type MeetingNote = InferSelectModel<typeof meetingNotes>;
export type InsertMeetingNote = InferInsertModel<typeof meetingNotes>;

export type Member = InferSelectModel<typeof members>;
export type InsertMember = InferInsertModel<typeof members>;

export type ProjectCollaborator = InferSelectModel<typeof projectCollaborators>;
export type InsertProjectCollaborator = InferInsertModel<typeof projectCollaborators>;

export type ProjectUpdate = InferSelectModel<typeof projectUpdates>;
export type InsertProjectUpdate = InferInsertModel<typeof projectUpdates>;

export type ForumVote = InferSelectModel<typeof forumVotes>;
export type InsertForumVote = InferInsertModel<typeof forumVotes>;

export type Document = InferSelectModel<typeof documents>;
export type InsertDocument = InferInsertModel<typeof documents>;

export type DocumentAuditTrail = InferSelectModel<typeof documentAuditTrail>;
export type InsertDocumentAuditTrail = InferInsertModel<typeof documentAuditTrail>;

export type DocumentShare = InferSelectModel<typeof documentShares>;
export type InsertDocumentShare = InferInsertModel<typeof documentShares>;

export type InnovationBounty = InferSelectModel<typeof innovationBounties>;
export type InsertInnovationBounty = InferInsertModel<typeof innovationBounties>;

export type BountyProposal = InferSelectModel<typeof bountyProposals>;
export type InsertBountyProposal = InferInsertModel<typeof bountyProposals>;

export type BountyComment = InferSelectModel<typeof bountyComments>;
export type InsertBountyComment = InferInsertModel<typeof bountyComments>;
