# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 14+ (Pages Router) DAO platform for Fort Worth civic innovation. Features multi-provider auth (Privy), distributed SQLite (Turso), and forum/project management.

## Development Commands

```bash
npm install          # Install deps (Node >=18, npm >=9)
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # Lint + type check
npm run format       # Prettier format

# Database (Drizzle + Turso)
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema directly
npm run db:studio    # Drizzle Studio GUI
npm run db:seed      # Seed sample data
```

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_PRIVY_APP_ID` / `PRIVY_APP_SECRET` - Privy auth
- `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` - Database

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
    └── members/
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

## API Route Pattern

All API routes use middleware composition:

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

## Key Patterns

**ID Generation**: Always use `generateId()` from `@utils/id-generator` for new records (UUIDv7)

**Error Classes**: Use from `@core/errors`:
- `NotFoundError('Post')` → 404
- `ValidationError('Invalid input')` → 400
- `UnauthorizedError()` → 401

**Service/Repository**: Business logic in services, data access in repositories. See `src/features/forum/` as reference.

**Authentication**:
- Client: `usePrivy()` hook, PrivyProvider in `_app.tsx`
- Server: `withAuth` middleware adds `req.claims.userId`
- Embedded wallets created automatically on login

## Database

Schema in `src/core/database/schema.ts`. Key tables: `users`, `members`, `forum_posts`, `projects`, `meeting_notes`, `forum_votes`, `documents`, `innovation_bounties`

## Legacy Compatibility

Old imports (`lib/`, `src/db/`, `components/`, `hooks/`) still work. Prefer new path aliases for new code.