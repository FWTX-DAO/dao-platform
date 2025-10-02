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
  },
} as const;
