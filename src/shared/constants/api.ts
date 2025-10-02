export const API_ROUTES = {
  AUTH: {
    VERIFY: '/api/verify',
  },
  FORUM: {
    BASE: '/api/forums',
    POSTS: '/api/forums/posts',
    POST_BY_ID: (id: string) => `/api/forums/posts/${id}`,
    VOTE: (id: string) => `/api/forums/posts/${id}/vote`,
    REPLIES: (id: string) => `/api/forums/posts/${id}/replies`,
  },
  PROJECTS: {
    BASE: '/api/projects',
    BY_ID: (id: string) => `/api/projects/${id}`,
    JOIN: (id: string) => `/api/projects/${id}/join`,
    UPDATES: (id: string) => `/api/projects/${id}/updates`,
  },
  BOUNTIES: {
    BASE: '/api/bounties',
    BY_ID: (id: string) => `/api/bounties/${id}`,
    SCREENING: '/api/bounties/screening',
    MY_BOUNTIES: '/api/bounties/my',
  },
  DOCUMENTS: {
    BASE: '/api/documents',
    BY_ID: (id: string) => `/api/documents/${id}`,
    UPLOAD: '/api/documents/upload',
    SERVER_UPLOAD: '/api/documents/server-upload',
  },
  MEETING_NOTES: {
    BASE: '/api/meeting-notes',
  },
  MEMBERS: {
    BASE: '/api/members',
    STATS: '/api/members/stats',
  },
  USERS: {
    PROFILE: '/api/users/profile',
  },
  DASHBOARD: {
    STATS: '/api/dashboard/stats',
  },
} as const;
