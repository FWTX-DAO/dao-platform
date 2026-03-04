# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 (Pages Router) DAO platform for Fort Worth civic innovation. Features multi-provider auth (Privy), PostgreSQL (PlanetScale via pg), Pinata for IPFS file storage, and forum/project management.

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

Feature-based architecture with service/repository pattern:

```
src/
├── core/              # Infrastructure
│   ├── auth/          # Privy token verification
│   ├── database/      # Schema, client, queries
│   ├── middleware/    # compose, withAuth, errorHandler, withValidation
│   ├── errors/        # AppError, NotFoundError, ValidationError, UnauthorizedError
│   └── utils/         # apiResponse helpers
├── shared/
│   ├── components/    # UI components (AppLayout, ui/)
│   ├── hooks/         # Shared React hooks
│   ├── types/         # Global TypeScript types
│   ├── utils/         # id-generator, cn, etc.
│   └── constants/     # API_ROUTES, queryKeys, VALIDATION_LIMITS
└── features/          # Each has: services/, types/, index.ts
    ├── forum/         # ForumService + ForumRepository
    ├── projects/
    ├── bounties/
    ├── meeting-notes/
    ├── members/
    ├── activities/
    ├── rbac/
    └── subscriptions/
```

## Path Aliases

```typescript
import { db } from '@core/database';
import { compose, withAuth } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { NotFoundError } from '@core/errors';
import { forumService } from '@features/forum';
import { generateId } from '@utils/id-generator';
import { Button } from '@components/ui/button';
import type { User } from '@shared/types';
```

## API Route Patterns

Two authentication patterns are used:

**Pattern 1: Middleware composition** (preferred for new routes)

```typescript
import type { NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { forumService } from '@features/forum';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data = await forumService.getPostsWithMetadata(req.claims.userId);
    return apiResponse.success(res, data);
  }
  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(errorHandler, withAuth)(handler);
```

**Pattern 2: Direct authentication** (common in existing routes)

```typescript
import { authenticateRequest } from '@utils/api-helpers';
import { getOrCreateUser } from '@core/database/queries/users';

const claims = await authenticateRequest(req);
const user = await getOrCreateUser(claims.userId, claims.email);
```

**Validation middleware** (uses Zod):

```typescript
import { withValidation } from '@core/middleware';
import { z } from 'zod';

const schema = z.object({ title: z.string(), content: z.string() });
export default compose(errorHandler, withAuth, withValidation(schema))(handler);
```

## Key Patterns

**ID Generation**: Always use `generateId()` from `@utils/id-generator` for new records (UUIDv7)

**Error Classes**: Use from `@core/errors`:

- `NotFoundError('Post')` → 404
- `ValidationError('Invalid input')` → 400
- `UnauthorizedError()` → 401

**Service/Repository**: Business logic in services, data access in repositories. See `src/features/forum/` as reference.

**Authentication**:

- Client: `usePrivy()` hook, PrivyProvider in `_app.tsx`
- Server: `withAuth` middleware adds `req.claims.userId`, or use `authenticateRequest(req)` directly
- Embedded wallets created automatically on login

**React Query Hooks**: Client data fetching uses TanStack Query with optimistic updates. See `src/shared/hooks/` for patterns:

- Use `queryKeys` from `@shared/constants` for consistent cache keys
- Hooks use `getAccessToken()` from Privy for authenticated requests
- Mutations include optimistic updates with rollback on error

**File Storage**: Pinata helpers in `@utils/api-helpers` for IPFS upload/download:

```typescript
import { pinataHelpers } from '@utils/api-helpers';
await pinataHelpers.uploadFile(file, { name: 'doc.pdf', network: 'private' });
```

## Database

PostgreSQL via `pg` + `drizzle-orm/node-postgres`. Schema in `src/core/database/schema.ts` (pgTable). Key tables: `users`, `members`, `forum_posts`, `projects`, `meeting_notes`, `forum_votes`, `documents`, `innovation_bounties`, `roles`, `permissions`, `member_roles`, `member_activities`

## Legacy Compatibility

Old imports (`lib/`, `src/db/`, `components/`, `hooks/`) still work. Prefer new path aliases for new code.
