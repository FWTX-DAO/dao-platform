# Repository Refactoring Guide

This document provides guidance for restructuring the FWTX DAO platform for better organization and modularity based on Next.js, TypeScript, and modern web development best practices.

## 📊 Current State Analysis

### Strengths
- Good separation of concerns with dedicated hooks for data fetching
- Proper TypeScript usage with strict configuration
- Clear database schema organization with Drizzle ORM
- Authentication middleware pattern implemented

### Areas for Improvement
- Mixed file locations (lib vs src folders)
- API routes lack consistent structure and middleware patterns
- No clear domain-driven organization
- Missing shared types/interfaces location
- Lack of service layer abstraction

## 🎯 Recommended Repository Structure

```
src/
├── features/           # Domain-driven feature modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── forum/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── api/      # Feature-specific API helpers
│   ├── bounties/
│   ├── projects/
│   ├── members/
│   └── meeting-notes/
├── core/              # Core application logic
│   ├── auth/         # Authentication middleware
│   ├── database/     # Database config & client
│   ├── config/       # App configuration
│   └── middleware/   # Shared middleware
├── shared/           # Shared across features
│   ├── components/   # Reusable UI components
│   ├── hooks/       # Shared hooks
│   ├── types/       # Global TypeScript types
│   ├── utils/       # Utility functions
│   └── constants/   # App-wide constants
└── styles/          # Global styles
```

## 📋 Specific Recommendations

### 1. Adopt Feature-Based Architecture

Organize code by domain/feature rather than technical layer. Each feature should be self-contained with its own components, hooks, services, and types.

**Example:**
```typescript
// src/features/forum/types/index.ts
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  category: string;
  createdAt: string;
}

export interface ForumVote {
  postId: string;
  userId: string;
  voteType: number;
}

export interface CreatePostDTO {
  title: string;
  content: string;
  category?: string;
  parentId?: string;
}

// src/features/forum/services/forum.service.ts
export class ForumService {
  constructor(private repository: ForumRepository) {}
  
  async getPosts(filters?: PostFilters): Promise<ForumPost[]> {
    const posts = await this.repository.findAll(filters);
    return this.enrichWithMetadata(posts);
  }
  
  async createPost(data: CreatePostDTO, userId: string): Promise<ForumPost> {
    const sanitized = this.sanitizeInput(data);
    return this.repository.create(sanitized, userId);
  }
}

// src/features/forum/hooks/useForumPosts.ts
import { ForumService } from '../services/forum.service';

export function useForumPosts() {
  return useQuery({
    queryKey: forumKeys.posts(),
    queryFn: () => forumService.getPosts()
  });
}
```

### 2. Implement API Route Handlers Pattern

Create reusable middleware for common API route operations like authentication, validation, and error handling.

**Example:**
```typescript
// src/core/middleware/withAuth.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { authenticateRequest } from '@/core/auth/privy';
import { getOrCreateUser } from '@/core/database/queries/users';

export interface AuthenticatedRequest extends NextApiRequest {
  user: User;
  claims: AuthTokenClaims;
}

export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const claims = await authenticateRequest(req);
      const user = await getOrCreateUser(claims.userId);
      
      (req as AuthenticatedRequest).user = user;
      (req as AuthenticatedRequest).claims = claims;
      
      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

// src/core/middleware/withValidation.ts
import { z, ZodSchema } from 'zod';

export function withValidation<T extends ZodSchema>(schema: T) {
  return (handler: NextApiHandler) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        req.body = schema.parse(req.body);
        return handler(req, res);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            error: 'Validation failed',
            details: error.errors 
          });
        }
        throw error;
      }
    };
  };
}

// src/core/middleware/compose.ts
export function compose(...middlewares: Array<(h: NextApiHandler) => NextApiHandler>) {
  return (handler: NextApiHandler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// pages/api/forums/posts.ts
import { withAuth } from '@/core/middleware/withAuth';
import { withValidation } from '@/core/middleware/withValidation';
import { compose } from '@/core/middleware/compose';
import { ForumController } from '@/features/forum/api/forum.controller';
import { CreatePostSchema } from '@/features/forum/types/schemas';

export default compose(
  withAuth,
  withValidation(CreatePostSchema)
)(ForumController.handlePosts);
```

### 3. Centralize Type Definitions

Create a shared types directory for global types and interfaces used across features.

**Example:**
```typescript
// src/shared/types/api.ts
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// src/shared/types/database.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, forumPosts, projects } from '@/core/database/schema';

export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type ForumPost = InferSelectModel<typeof forumPosts>;
export type InsertForumPost = InferInsertModel<typeof forumPosts>;

export type Project = InferSelectModel<typeof projects>;
export type InsertProject = InferInsertModel<typeof projects>;

// src/shared/types/auth.ts
import type { AuthTokenClaims } from '@privy-io/server-auth';

export interface AuthContext {
  user: User;
  claims: AuthTokenClaims;
  isAuthenticated: boolean;
}
```

### 4. Create Service Layer

Implement the repository pattern and service layer to separate data access from business logic.

**Example:**
```typescript
// src/features/forum/services/forum.repository.ts
import { db, forumPosts, users, forumVotes } from '@/core/database';
import { eq, sql, isNull, and } from 'drizzle-orm';
import type { ForumPost, CreatePostDTO } from '../types';

export class ForumRepository {
  async findAll(filters?: { category?: string }) {
    let query = db
      .select({
        id: forumPosts.id,
        title: forumPosts.title,
        content: forumPosts.content,
        category: forumPosts.category,
        authorId: forumPosts.authorId,
        authorName: users.username,
        createdAt: forumPosts.createdAt,
        updatedAt: forumPosts.updatedAt,
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(isNull(forumPosts.parentId));

    if (filters?.category) {
      query = query.where(eq(forumPosts.category, filters.category));
    }

    return query.orderBy(sql`${forumPosts.createdAt} DESC`);
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(forumPosts)
      .where(eq(forumPosts.id, id))
      .limit(1);
    
    return results[0] ?? null;
  }

  async create(data: CreatePostDTO, authorId: string) {
    const id = generateId();
    await db.insert(forumPosts).values({
      id,
      authorId,
      ...data,
    });
    
    return this.findById(id);
  }

  async getVoteCount(postId: string) {
    const result = await db
      .select({
        count: sql<number>`COALESCE(SUM(vote_type), 0)`,
      })
      .from(forumVotes)
      .where(eq(forumVotes.postId, postId));
    
    return result[0]?.count ?? 0;
  }

  async getUserVote(postId: string, userId: string) {
    const result = await db
      .select()
      .from(forumVotes)
      .where(
        and(
          eq(forumVotes.postId, postId),
          eq(forumVotes.userId, userId)
        )
      )
      .limit(1);
    
    return result[0]?.voteType ?? 0;
  }
}

// src/features/forum/services/forum.service.ts
import { ForumRepository } from './forum.repository';
import { sanitizeForumPostInput } from '../utils/sanitization';
import type { ForumPost, CreatePostDTO } from '../types';

export class ForumService {
  constructor(private repository: ForumRepository) {}
  
  async getPostsWithMetadata(userId: string, filters?: { category?: string }) {
    const posts = await this.repository.findAll(filters);
    
    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        upvotes: await this.repository.getVoteCount(post.id),
        hasUpvoted: await this.repository.getUserVote(post.id, userId),
      }))
    );
  }

  async createPost(data: CreatePostDTO, userId: string): Promise<ForumPost> {
    const sanitized = sanitizeForumPostInput(data);
    
    if (!sanitized.title || !sanitized.content) {
      throw new AppError(400, 'Title and content are required');
    }
    
    return this.repository.create(sanitized, userId);
  }

  async getPostById(id: string, userId: string) {
    const post = await this.repository.findById(id);
    
    if (!post) {
      throw new AppError(404, 'Post not found');
    }
    
    return {
      ...post,
      upvotes: await this.repository.getVoteCount(id),
      hasUpvoted: await this.repository.getUserVote(id, userId),
    };
  }
}

// src/features/forum/services/index.ts
export const forumRepository = new ForumRepository();
export const forumService = new ForumService(forumRepository);
```

### 5. Implement Barrel Exports

Use index files to export public APIs from each feature module.

**Example:**
```typescript
// src/features/forum/index.ts
export * from './components';
export * from './hooks';
export * from './types';
export { forumService } from './services';

// Usage in other files
import { useForumPosts, ForumPost, forumService } from '@features/forum';
```

### 6. Add Path Aliases

Configure TypeScript path aliases for cleaner imports.

**Example:**
```json
// tsconfig.json
{
  "extends": [
    "@tsconfig/strictest/tsconfig",
    "@tsconfig/node18/tsconfig",
    "@tsconfig/next/tsconfig"
  ],
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "declaration": true,
    "sourceMap": true,
    "stripInternal": true,
    "allowJs": true,
    "noEmit": true,
    "module": "esnext",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noImplicitReturns": false,
    "noPropertyAccessFromIndexSignature": false,
    "exactOptionalPropertyTypes": false,
    "moduleResolution": "node",
    "paths": {
      "@/*": ["./src/*"],
      "@features/*": ["./src/features/*"],
      "@core/*": ["./src/core/*"],
      "@shared/*": ["./src/shared/*"],
      "@components/*": ["./src/shared/components/*"],
      "@hooks/*": ["./src/shared/hooks/*"],
      "@utils/*": ["./src/shared/utils/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
  "exclude": ["node_modules"]
}
```

### 7. Implement Error Handling Pattern

Create custom error classes and centralized error handling middleware.

**Example:**
```typescript
// src/core/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

// src/core/middleware/errorHandler.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { AppError } from '@/core/errors/AppError';
import { ZodError } from 'zod';

export const errorHandler = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          error: error.message,
          ...(error instanceof ValidationError && { details: error.details }),
        });
      }
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      // Unhandled errors
      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  };
};

// Usage
export default compose(
  errorHandler,
  withAuth
)(handler);
```

### 8. Add Constants Management

Centralize all constants and configuration values.

**Example:**
```typescript
// src/shared/constants/api.ts
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
} as const;

// src/shared/constants/query-keys.ts
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
} as const;

// src/shared/constants/validation.ts
export const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 10000,
  BIO_MAX_LENGTH: 500,
  USERNAME_MAX_LENGTH: 50,
  TAGS_MAX_COUNT: 10,
  ATTENDEES_MAX_COUNT: 100,
} as const;

// src/shared/constants/index.ts
export * from './api';
export * from './query-keys';
export * from './validation';
```

## 🚀 Migration Strategy

### Phase 1: Core Setup (Week 1)
1. Create new directory structure under `src/`
2. Set up path aliases in `tsconfig.json`
3. Move database files to `src/core/database/`
4. Create `src/core/auth/` and move authentication logic
5. Set up `src/shared/constants/`

### Phase 2: Shared Layer (Week 2)
1. Move UI components to `src/shared/components/`
2. Create `src/shared/types/` and centralize type definitions
3. Move utility functions to `src/shared/utils/`
4. Create shared hooks in `src/shared/hooks/`

### Phase 3: Feature Migration - Forum (Week 3)
1. Create `src/features/forum/` structure
2. Move forum-related components
3. Implement service layer for forum
4. Create repository pattern for forum data access
5. Migrate forum hooks
6. Update API routes to use new controllers

### Phase 4: Feature Migration - Projects (Week 4)
1. Create `src/features/projects/` structure
2. Move project-related components
3. Implement service layer
4. Create repository pattern
5. Migrate hooks and update API routes

### Phase 5: Feature Migration - Bounties & Others (Week 5)
1. Migrate bounties feature
2. Migrate meeting notes feature
3. Migrate members feature
4. Update all imports across the codebase

### Phase 6: Middleware & Error Handling (Week 6)
1. Implement middleware composition pattern
2. Create error handling middleware
3. Add validation middleware with Zod
4. Update all API routes to use new middleware

### Phase 7: Cleanup & Testing (Week 7)
1. Remove old directory structures
2. Update all remaining imports
3. Add comprehensive tests
4. Update documentation
5. Run full test suite and fix issues

## 📚 Additional Best Practices

### 1. Use Zod for Runtime Validation

Replace manual sanitization with Zod schemas for type-safe validation.

```typescript
// src/features/forum/types/schemas.ts
import { z } from 'zod';
import { VALIDATION_LIMITS } from '@shared/constants';

export const CreatePostSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(VALIDATION_LIMITS.TITLE_MAX_LENGTH, 'Title is too long'),
  content: z.string()
    .min(1, 'Content is required')
    .max(VALIDATION_LIMITS.CONTENT_MAX_LENGTH, 'Content is too long'),
  category: z.string().optional().default('General'),
  parentId: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
```

### 2. Implement Repository Pattern Consistently

Apply the repository pattern across all features for consistent data access.

```typescript
// Base repository interface
export interface IRepository<T, CreateDTO, UpdateDTO> {
  findAll(filters?: unknown): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}
```

### 3. Add Integration Tests

Create integration tests for API routes and services.

```typescript
// src/features/forum/__tests__/forum.integration.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/forums/posts';

describe('Forum Posts API', () => {
  it('should return all posts for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toBeInstanceOf(Array);
  });
});
```

### 4. Use React Query Query Keys Factory

Implement a query keys factory for type-safe and consistent cache management.

```typescript
// Already shown in constants/query-keys.ts above
// Usage in hooks:
import { queryKeys } from '@shared/constants';

export function useForumPosts() {
  return useQuery({
    queryKey: queryKeys.forum.posts(),
    queryFn: () => forumService.getPosts(),
  });
}
```

### 5. Implement Feature Flags

Add a feature flags system for gradual rollout of new features.

```typescript
// src/core/config/features.ts
export const FEATURE_FLAGS = {
  ENABLE_BOUNTIES: process.env.NEXT_PUBLIC_ENABLE_BOUNTIES === 'true',
  ENABLE_MEETING_NOTES: true,
  ENABLE_ADVANCED_SEARCH: false,
} as const;

// Usage
import { FEATURE_FLAGS } from '@core/config/features';

if (FEATURE_FLAGS.ENABLE_BOUNTIES) {
  // Show bounties feature
}
```

### 6. Add API Response Helpers

Create utility functions for consistent API responses.

```typescript
// src/core/utils/api-response.ts
import type { NextApiResponse } from 'next';
import type { ApiResponse } from '@shared/types/api';

export const apiResponse = {
  success<T>(res: NextApiResponse, data: T, statusCode = 200) {
    return res.status(statusCode).json({ data } as ApiResponse<T>);
  },

  error(res: NextApiResponse, error: string, statusCode = 400) {
    return res.status(statusCode).json({ error } as ApiResponse);
  },

  notFound(res: NextApiResponse, resource = 'Resource') {
    return res.status(404).json({ 
      error: `${resource} not found` 
    } as ApiResponse);
  },

  unauthorized(res: NextApiResponse, message = 'Unauthorized') {
    return res.status(401).json({ error: message } as ApiResponse);
  },
};
```

## 🎯 Expected Benefits

After implementing these changes, you will achieve:

- ✅ **Better Code Organization**: Clear separation by domain/feature
- ✅ **Improved Type Safety**: Centralized types and Zod validation
- ✅ **Easier Testing**: Service layer and repository pattern enable unit testing
- ✅ **Clear Separation of Concerns**: Business logic separated from data access
- ✅ **Reduced Coupling**: Features are self-contained and independent
- ✅ **Scalable Architecture**: Easy to add new features without affecting existing code
- ✅ **Better Developer Experience**: Clear structure makes onboarding easier
- ✅ **Maintainability**: Consistent patterns across the codebase
- ✅ **Reusability**: Shared components and utilities reduce duplication

## 📖 References

- [Next.js Project Structure Best Practices](https://nextjs.org/docs/app/building-your-application/routing/colocation)
- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Zod Documentation](https://zod.dev/)
- [React Query Best Practices](https://tkdodo.eu/blog/effective-react-query-keys)
