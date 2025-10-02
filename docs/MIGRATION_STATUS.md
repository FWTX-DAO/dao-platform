# Repository Refactoring - Migration Status

## Completed Phases

### Phase 1: Core Setup ✅
- [x] Created new directory structure under `src/`
- [x] Set up path aliases in `tsconfig.json`
- [x] Moved database files to `src/core/database/`
- [x] Created `src/core/auth/` with Privy authentication utilities
- [x] Set up `src/core/middleware/` with composition pattern
- [x] Created `src/core/errors/` with custom error classes
- [x] Set up `src/core/utils/` with API response helpers
- [x] Created `src/shared/constants/` with API routes, query keys, and validation constants

### Phase 2: Shared Layer ✅
- [x] Moved UI components to `src/shared/components/`
- [x] Created `src/shared/types/` and centralized type definitions
- [x] Moved utility functions to `src/shared/utils/`
- [x] Created shared hooks in `src/shared/hooks/`

## New File Structure

```
src/
├── core/                   # Core application logic
│   ├── auth/              # Privy authentication utilities
│   │   ├── privy.ts       # Auth token verification
│   │   └── index.ts
│   ├── database/          # Database config & client (from src/db)
│   │   ├── client.ts      # DB operations
│   │   ├── index.ts       # DB client setup
│   │   ├── schema.ts      # Drizzle schema
│   │   ├── migrate.ts
│   │   ├── seed.ts
│   │   └── queries/
│   ├── middleware/        # Shared middleware
│   │   ├── compose.ts     # Middleware composition
│   │   ├── errorHandler.ts
│   │   ├── withAuth.ts
│   │   ├── withValidation.ts
│   │   └── index.ts
│   ├── errors/            # Custom error classes
│   │   ├── AppError.ts
│   │   └── index.ts
│   └── utils/             # Core utilities
│       ├── api-response.ts
│       └── index.ts
├── shared/                # Shared across features
│   ├── components/        # Reusable UI components (from components/)
│   │   ├── ui/
│   │   ├── AppLayout.tsx
│   │   └── ...
│   ├── hooks/             # Shared hooks (from hooks/)
│   │   ├── useBounties.ts
│   │   ├── useForumPosts.ts
│   │   └── ...
│   ├── types/             # Global TypeScript types
│   │   ├── api.ts
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── index.ts
│   ├── utils/             # Utility functions (from lib/)
│   │   ├── cn.ts
│   │   ├── utils.ts
│   │   └── ...
│   └── constants/         # App-wide constants
│       ├── api.ts
│       ├── query-keys.ts
│       ├── validation.ts
│       └── index.ts
├── features/              # Feature modules (structure ready)
│   ├── forum/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── api/
│   ├── projects/
│   ├── bounties/
│   ├── meeting-notes/
│   └── members/
└── styles/               # Global styles
```

## Path Aliases Configured

```json
{
  "@/*": ["./src/*"],
  "@features/*": ["./src/features/*"],
  "@core/*": ["./src/core/*"],
  "@shared/*": ["./src/shared/*"],
  "@components/*": ["./src/shared/components/*"],
  "@hooks/*": ["./src/shared/hooks/*"],
  "@utils/*": ["./src/shared/utils/*"],
  "@types/*": ["./src/shared/types/*"]
}
```

## Remaining Work

### Phase 3-5: Feature Modules (Not Started)
These phases require creating service and repository layers for each feature. The directory structure is ready, but implementation is pending:

- [ ] Forum feature with ForumService and ForumRepository
- [ ] Projects feature with ProjectService and ProjectRepository  
- [ ] Bounties feature with BountyService and BountyRepository
- [ ] Meeting Notes feature with service/repository
- [ ] Members feature with service/repository

### Phase 6: Middleware Integration (Partially Complete)
- [x] Middleware composition pattern implemented
- [x] Error handling middleware created
- [ ] Update API routes to use new middleware patterns
- [ ] Example API route migration needed

### Phase 7: Cleanup and Testing (Not Started)
- [ ] Update all imports across codebase to use new paths
- [ ] Remove old directory structures (after verifying all imports work)
- [ ] Update CLAUDE.md documentation
- [ ] Run lint and typecheck
- [ ] Test all functionality

## How to Use the New Structure

### Using Core Middleware

```typescript
// pages/api/example.ts
import { compose, errorHandler, withAuth } from '@core/middleware';
import { apiResponse } from '@core/utils';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  // Your logic here
  return apiResponse.success(res, data);
};

export default compose(
  errorHandler,
  withAuth
)(handler);
```

### Using Shared Constants

```typescript
import { API_ROUTES, queryKeys, VALIDATION_LIMITS } from '@shared/constants';

// Use in components
const { data } = useQuery({
  queryKey: queryKeys.forum.posts(),
  queryFn: () => fetch(API_ROUTES.FORUM.POSTS),
});
```

### Using Shared Types

```typescript
import type { User, ForumPost, ApiResponse } from '@shared/types';
```

## Migration Strategy for Remaining Work

### For Feature Modules:
1. Identify feature-specific code in `pages/api/`
2. Create service class in `src/features/{feature}/services/`
3. Create repository class for data access
4. Move hooks from `src/shared/hooks/` to feature-specific hooks
5. Update API routes to use new services

### For API Routes:
1. Start with one feature (e.g., forum)
2. Refactor one endpoint at a time
3. Use middleware composition pattern
4. Test thoroughly before moving to next endpoint

### For Import Updates:
1. Use find/replace to update old imports to new path aliases
2. Examples:
   - `from '../../../src/db'` → `from '@core/database'`
   - `from '../../lib/utils'` → `from '@utils/utils'`
   - `from '../components/ui/button'` → `from '@components/ui/button'`

## Notes

- TypeScript path resolution requires server restart to recognize new aliases
- Old directories (components/, hooks/, lib/, src/db/) should be kept until all imports are updated
- The new structure is backward compatible - old imports still work
- Migration can be done incrementally, one feature at a time

## Next Steps

1. Restart TypeScript server to recognize path aliases
2. Create one feature module as a reference implementation (e.g., forum)
3. Update one API endpoint to use new middleware pattern
4. Document the pattern for other developers
5. Gradually migrate remaining features
