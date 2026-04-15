export const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 10000,
  BIO_MAX_LENGTH: 500,
  USERNAME_MAX_LENGTH: 50,
  TAGS_MAX_COUNT: 10,
  ATTENDEES_MAX_COUNT: 100,
  DESCRIPTION_MAX_LENGTH: 2000,
  NAME_MAX_LENGTH: 100,
} as const;

export const FORUM_CATEGORIES = [
  "General",
  "Infrastructure",
  "Sustainability",
  "Public Safety",
  "Economic Development",
  "Community Engagement",
  "Technology",
  "Other",
] as const;

export const PROJECT_STATUSES = ["proposed", "active", "completed"] as const;
export const MEMBER_TYPES = ["basic", "contributor", "council"] as const;
export const MEMBERSHIP_STATUSES = ["active", "inactive", "suspended"] as const;
export const BOUNTY_STATUSES = [
  "draft",
  "screening",
  "published",
  "assigned",
  "completed",
  "cancelled",
] as const;

// Bounty filter options for UI
export const BOUNTY_CATEGORIES = [
  "all",
  "infrastructure",
  "sustainability",
  "public-safety",
  "education",
  "healthcare",
  "transportation",
  "economic-development",
  "civic-engagement",
  "other",
] as const;

export const BOUNTY_ORG_TYPES = [
  "all",
  "civic",
  "commercial",
  "non-profit",
  "government",
  "educational",
] as const;

export const BOUNTY_STATUS_FILTERS = [
  "published",
  "assigned",
  "completed",
  "all",
] as const;

// Membership tiers
export const MEMBERSHIP_TIERS = ["free", "monthly", "annual"] as const;

// Onboarding
export const ONBOARDING_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
] as const;
export const CONTACT_METHODS = ["email", "phone", "none"] as const;
export const AVAILABILITY_OPTIONS = [
  "full-time",
  "part-time",
  "volunteer",
  "occasional",
] as const;

// RBAC
export const ROLE_NAMES = ["admin", "moderator", "member", "guest"] as const;
export const ROLE_LEVELS = {
  guest: 0,
  member: 10,
  moderator: 50,
  admin: 100,
} as const;
export const RBAC_RESOURCES = [
  "forum",
  "projects",
  "bounties",
  "members",
  "documents",
  "meetings",
  "admin",
] as const;
export const RBAC_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
] as const;

// Subscriptions
export const SUBSCRIPTION_STATUSES = [
  "active",
  "past_due",
  "canceled",
  "trialing",
  "incomplete",
] as const;
export const PAYMENT_STATUSES = [
  "succeeded",
  "failed",
  "pending",
  "refunded",
] as const;

// Activity tracking
export const ACTIVITY_TYPES = [
  "forum_post",
  "forum_reply",
  "forum_vote",
  "project_created",
  "project_joined",
  "bounty_submitted",
  "bounty_proposal",
  "meeting_created",
  "document_uploaded",
  "document_shared",
  "login",
  "profile_updated",
  "role_granted",
  "subscription_created",
  "comment_posted",
  "event_attended",
] as const;

// Points awarded per activity type
export const ACTIVITY_POINTS: Record<(typeof ACTIVITY_TYPES)[number], number> =
  {
    forum_post: 10,
    forum_reply: 5,
    forum_vote: 2,
    project_created: 25,
    project_joined: 10,
    bounty_submitted: 20,
    bounty_proposal: 10,
    meeting_created: 15,
    document_uploaded: 10,
    document_shared: 3,
    login: 0,
    profile_updated: 0,
    role_granted: 0,
    subscription_created: 100,
    comment_posted: 2,
    event_attended: 5,
  } as const;
