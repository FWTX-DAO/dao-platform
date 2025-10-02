# Refactored API Route Example

This document shows how to refactor an existing API route to use the new architecture.

## Before: Old Pattern

```typescript
// pages/api/forums/posts.ts (OLD)
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, forumPosts, users, forumVotes } from '../../../src/db';
import { eq, sql, isNull } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const posts = await db
        .select({
          post: forumPosts,
          author: users,
          voteCount: sql<number>`...`,
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.authorId, users.id))
        .where(isNull(forumPosts.parentId));
      
      return res.status(200).json(posts);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'POST') {
    // Similar messy logic...
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

## After: New Pattern

```typescript
// pages/api/forums/posts.ts (NEW)
import type { NextApiResponse } from 'next';
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { forumService } from '@features/forum';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.claims.userId;

  if (req.method === 'GET') {
    const posts = await forumService.getPostsWithMetadata(userId);
    return apiResponse.success(res, posts);
  }

  if (req.method === 'POST') {
    const post = await forumService.createPost(req.body, userId);
    return apiResponse.success(res, post, 201);
  }

  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(
  errorHandler,
  withAuth
)(handler);
```

## With Validation

```typescript
// pages/api/forums/posts.ts (WITH VALIDATION)
import { compose, errorHandler, withAuth, withValidation, type AuthenticatedRequest } from '@core/middleware';
import { apiResponse } from '@core/utils';
import { forumService, CreatePostSchema } from '@features/forum';

async function getHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const posts = await forumService.getPostsWithMetadata(req.claims.userId);
  return apiResponse.success(res, posts);
}

async function postHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  const post = await forumService.createPost(req.body, req.claims.userId);
  return apiResponse.success(res, post, 201);
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === 'GET') return getHandler(req, res);
  if (req.method === 'POST') return postHandler(req, res);
  return apiResponse.error(res, 'Method not allowed', 405);
}

export default compose(
  errorHandler,
  withAuth,
  withValidation(CreatePostSchema)
)(handler);
```

## Benefits

1. **Separation of Concerns**: Business logic in service layer, not in API route
2. **Reusability**: `forumService` can be used in multiple API routes
3. **Type Safety**: TypeScript knows about `AuthenticatedRequest` and types are centralized
4. **Error Handling**: Centralized error handling middleware
5. **Consistency**: All API routes follow the same pattern
6. **Testability**: Service layer can be unit tested without HTTP concerns
7. **Validation**: Zod schemas provide runtime type safety

## Migration Checklist

When refactoring an API route:

- [ ] Identify the feature (forum, projects, bounties, etc.)
- [ ] Create/update service methods in `src/features/{feature}/services/`
- [ ] Create/update repository methods if needed
- [ ] Define Zod schemas for validation in `src/features/{feature}/types/`
- [ ] Update API route to use middleware composition
- [ ] Replace manual error handling with `errorHandler` middleware
- [ ] Replace manual auth checks with `withAuth` middleware
- [ ] Use `apiResponse` helpers for consistent responses
- [ ] Test the endpoint thoroughly
