export const queryKeys = {
  auth: {
    user: () => ['auth', 'user'] as const,
  },
  forum: {
    all: () => ['forum'] as const,
    posts: () => [...queryKeys.forum.all(), 'posts'] as const,
    post: (id: string) => [...queryKeys.forum.posts(), id] as const,
    replies: (id: string) => [...queryKeys.forum.post(id), 'replies'] as const,
  },
  projects: {
    all: () => ['projects'] as const,
    list: () => [...queryKeys.projects.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.projects.all(), id] as const,
    updates: (id: string) => [...queryKeys.projects.detail(id), 'updates'] as const,
  },
  bounties: {
    all: () => ['bounties'] as const,
    list: () => [...queryKeys.bounties.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.bounties.all(), id] as const,
    my: () => [...queryKeys.bounties.all(), 'my'] as const,
  },
  documents: {
    all: () => ['documents'] as const,
    list: () => [...queryKeys.documents.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.documents.all(), id] as const,
  },
  meetingNotes: {
    all: () => ['meeting-notes'] as const,
    list: () => [...queryKeys.meetingNotes.all(), 'list'] as const,
  },
  members: {
    all: () => ['members'] as const,
    list: () => [...queryKeys.members.all(), 'list'] as const,
    stats: () => [...queryKeys.members.all(), 'stats'] as const,
    profile: () => [...queryKeys.members.all(), 'profile'] as const,
    directory: (filters?: Record<string, unknown>) => [...queryKeys.members.all(), 'directory', filters] as const,
    detail: (id: string) => [...queryKeys.members.all(), id] as const,
    roles: (id: string) => [...queryKeys.members.detail(id), 'roles'] as const,
    activities: (id: string) => [...queryKeys.members.detail(id), 'activities'] as const,
  },
  subscriptions: {
    all: () => ['subscriptions'] as const,
    active: () => [...queryKeys.subscriptions.all(), 'active'] as const,
    tiers: () => [...queryKeys.subscriptions.all(), 'tiers'] as const,
    detail: (id: string) => [...queryKeys.subscriptions.all(), id] as const,
  },
  activities: {
    all: () => ['activities'] as const,
    feed: () => [...queryKeys.activities.all(), 'feed'] as const,
    member: (id: string) => [...queryKeys.activities.all(), 'member', id] as const,
  },
  roles: {
    all: () => ['roles'] as const,
    detail: (id: string) => [...queryKeys.roles.all(), id] as const,
    permissions: (id: string) => [...queryKeys.roles.detail(id), 'permissions'] as const,
    memberRoles: (memberId: string) => [...queryKeys.roles.all(), 'member', memberId] as const,
  },
  stamps: {
    all: () => ['stamps'] as const,
    my: () => [...queryKeys.stamps.all(), 'my'] as const,
    member: (id: string) => [...queryKeys.stamps.all(), 'member', id] as const,
  },
} as const;
