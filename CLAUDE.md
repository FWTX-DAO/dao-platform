# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 (App Router) DAO platform for Fort Worth civic innovation. Features multi-provider auth (Privy), PostgreSQL (PlanetScale via pg), Pinata for IPFS file storage, and forum/project management.

## Development Commands

**Always use `bun` (not npm/node).** `bun dev` works as shorthand for `bun run dev`.

```bash
bun install          # Install deps
bun dev              # Dev server at localhost:3000
bun run build        # Production build
bun run lint         # ESLint + Prettier check + TypeScript check
bun run format       # Prettier format

# Database (Drizzle + PostgreSQL)
bun run db:generate  # Generate migrations from schema changes
bun run db:push      # Push schema directly to database
bun run db:studio    # Drizzle Studio GUI
bun run db:seed      # Seed sample data (tsx src/db/seed.ts)
bun run db:seed-rbac # Seed RBAC tiers, roles, permissions
```

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_PRIVY_APP_ID` / `PRIVY_APP_SECRET` - Privy auth
- `DATABASE_URL` - PostgreSQL connection string (PlanetScale)
- `PINATA_JWT` / `PINATA_GATEWAY` / `PINATA_GATEWAY_KEY` - IPFS file storage

## Architecture

Service/repository pattern colocated with App Router:

```
src/
├── app/
│   ├── _lib/          # Auth helpers (auth.ts), action utilities (action-utils.ts)
│   ├── _actions/      # Server actions (bounties, forum, projects, etc.)
│   ├── _services/     # Service/repository modules (each has: services/, types/, index.ts)
│   │   ├── activities/    # ActivitiesService + ActivitiesRepository
│   │   ├── forum/         # ForumService + ForumRepository
│   │   ├── members/       # MembersService + MembersRepository
│   │   ├── rbac/          # RbacService + RbacRepository
│   │   └── subscriptions/ # SubscriptionsService + SubscriptionsRepository
│   ├── _providers/    # PrivyProvider, QueryClientProvider
│   ├── (platform)/    # Authenticated platform pages (layout guards auth + onboarding)
│   └── (auth)/        # Auth pages (onboarding — layout guards auth + redirect if onboarded)
├── core/              # Infrastructure
│   ├── database/      # Schema, client, queries
│   ├── middleware/     # compose, withAuth, errorHandler, withValidation
│   ├── errors/        # AppError, NotFoundError, ValidationError, UnauthorizedError, ForbiddenError
│   └── utils/         # apiResponse helpers
└── shared/
    ├── components/    # UI components (AppLayout, ui/)
    ├── hooks/         # React Query hooks + useAuthReady
    ├── types/         # Global TypeScript types
    ├── utils/         # id-generator, cn, query-client, etc.
    └── constants/     # API_ROUTES, queryKeys, VALIDATION_LIMITS
```

## Path Aliases

```typescript
import { db } from '@core/database';
import { compose, withAuth } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { NotFoundError } from '@core/errors';
import { forumService } from '@services/forum';
import { generateId } from '@utils/id-generator';
import { Button } from '@components/ui/button';
import type { User } from '@shared/types';
```

## Server Action Patterns (App Router)

All data fetching and mutations use server actions in `src/app/_actions/`.

### Authentication (`src/app/_lib/auth.ts`)

```typescript
import { getAuthUser, requireAuth, requireAdmin, isUserAdmin } from '@/app/_lib/auth';

// getAuthUser()    — returns { claims, user } or null (never throws)
// requireAuth()    — redirects to '/' if not authenticated
// isUserAdmin(id)  — returns boolean, checks admin/council_member/screener roles
// requireAdmin()   — redirects to '/' if not admin, returns { ...auth, isAdmin: true }
// checkAdmin()     — soft check, returns { ...auth, isAdmin: boolean } (no redirect)
```

**Rules:**
- Server components/layouts: use `getAuthUser()` + manual redirect
- Server actions: use `requireAuth()` (auto-redirects on auth failure, never 500s)
- Admin-only hard gates: use `requireAdmin()` (auto-redirects non-admins)
- Admin soft checks: use `checkAdmin()`, check `isAdmin` before proceeding

### ActionResult Pattern (`src/app/_lib/action-utils.ts`)

**Queries** return data directly — auth failure triggers redirect, not a thrown error.

**Mutations** return `ActionResult<T>` — never throw raw `Error()`:

```typescript
import { type ActionResult, actionSuccess, actionError } from '@/app/_lib/action-utils';

export async function createBounty(data: Record<string, any>): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();
    // ... business logic ...
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}
```

**Consumer pattern:**
```typescript
const result = await createBounty(data);
if (!result.success) {
  setError(result.error);
  return;
}
// result.data.id is available
```

### Admin RBAC

Admin routes are guarded at two levels:
1. **Layout level** (`(platform)/admin/layout.tsx`): server-side redirect for non-admins
2. **Action level**: each admin action checks access before proceeding

For hard gates (redirect non-admins):
```typescript
export async function deleteUser(id: string) {
  await requireAdmin(); // redirects if not admin — no further check needed
  return membersService.deleteUser(id);
}
```

For soft checks (return empty/filtered data):
```typescript
export async function getRoles() {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) return [];
  return rbacService.getAllRoles();
}
```

## React Query Hooks

All hooks in `src/shared/hooks/` follow these conventions:

### Auth Guard with `useAuthReady`

Every `useQuery` hook MUST use the `useAuthReady()` guard to prevent queries from firing before Privy initializes:

```typescript
import { useAuthReady } from './useAuthReady';

export const useProjects = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsAction(),
    enabled: authReady,    // <-- REQUIRED for all authenticated queries
    staleTime: 1000 * 60,
  });
};
```

When combining with other `enabled` conditions:
```typescript
enabled: authReady && !!projectId,
```

### Mutation Hooks

Mutations don't need `useAuthReady` (they're user-initiated). Use optimistic updates with rollback:

```typescript
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectInput) => createProjectAction(data),
    onMutate: async (newData) => { /* optimistic update */ },
    onError: (_err, _data, context) => { /* rollback */ },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); },
  });
};
```

## Key Patterns

**ID Generation**: Always use `generateId()` from `@utils/id-generator` for new records (UUIDv7)

**Error Classes**: Use from `@core/errors` (for services/repositories, NOT server actions):

- `NotFoundError('Post')` → 404
- `ValidationError('Invalid input')` → 400
- `UnauthorizedError()` → 401
- `ForbiddenError()` → 403

**Service/Repository**: Business logic in services, data access in repositories. See `src/app/_services/forum/` as reference.

**Authentication**:

- Client: `usePrivy()` hook, PrivyProvider in `_providers/privy-provider.tsx`
- Server: `requireAuth()` in server actions, `getAuthUser()` in layouts
- Embedded wallets created automatically on login
- User identity: `usePrivy().user.id` is the Privy DID, `requireAuth().user.id` is the DB UUID — never compare these directly

**File Storage**: Pinata helpers in `@utils/api-helpers` for IPFS upload/download:

```typescript
import { pinataHelpers } from '@utils/api-helpers';
await pinataHelpers.uploadFile(file, { name: 'doc.pdf', network: 'private' });
```

## Database

PostgreSQL via `pg` + `drizzle-orm/node-postgres`. Schema in `src/core/database/schema.ts` (pgTable). Key tables: `users`, `members`, `forum_posts`, `projects`, `meeting_notes`, `forum_votes`, `documents`, `innovation_bounties`, `roles`, `permissions`, `member_roles`, `member_activities`

## API Route Patterns (Legacy Pages Router)

Some API routes still use the Pages Router middleware pattern:

```typescript
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
export default compose(errorHandler, withAuth)(handler);
```

Prefer server actions for new code.

## Legacy Compatibility

Old imports (`lib/`, `src/db/`, `components/`, `hooks/`) still work. Prefer new path aliases for new code.
