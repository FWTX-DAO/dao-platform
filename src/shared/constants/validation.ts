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
  'General',
  'Infrastructure',
  'Sustainability',
  'Public Safety',
  'Economic Development',
  'Community Engagement',
  'Technology',
  'Other',
] as const;

export const PROJECT_STATUSES = ['proposed', 'active', 'completed'] as const;
export const MEMBER_TYPES = ['basic', 'contributor', 'council'] as const;
export const MEMBERSHIP_STATUSES = ['active', 'inactive', 'suspended'] as const;
export const BOUNTY_STATUSES = ['draft', 'screening', 'published', 'assigned', 'completed', 'cancelled'] as const;
