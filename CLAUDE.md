# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14+ application using the Pages Router that serves as a DAO (Decentralized Autonomous Organization) platform for Fort Worth civic innovation. It features multi-provider authentication through Privy, a distributed SQLite database via Turso, and comprehensive forum/project management capabilities.

## Key Technologies

- **Next.js 14+** (Pages Router) - React framework
- **TypeScript** - Type-safe JavaScript with strict checking
- **Privy Auth** (@privy-io/react-auth, @privy-io/server-auth) - Multi-provider authentication
- **Turso** - Distributed SQLite at the edge
- **Drizzle ORM** - Type-safe database operations
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React 18.2.0** - UI library

## Development Commands

```bash
# Install dependencies (requires Node >=18.0.0, npm >=9.0.0)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting and type checking
npm run lint

# Format code
npm run format

# Database operations
npm run db:generate  # Generate migrations from schema changes
npm run db:push      # Apply schema to database
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Seed sample data
```

## Environment Setup

Create `.env.local` file with:
```
# Required
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>
TURSO_DATABASE_URL=<your-turso-database-url>
TURSO_AUTH_TOKEN=<your-turso-auth-token>

# Optional for session signers
NEXT_PUBLIC_SESSION_SIGNER_ID=<your-session-signer-id>
SESSION_SIGNER_SECRET=<your-session-signer-secret>
```

## Architecture Overview

**Note**: The codebase is undergoing a refactoring to feature-based architecture. See `docs/MIGRATION_STATUS.md` for details.

### New Architecture (In Progress)

The application now follows a feature-based architecture with clear separation of concerns:

```
src/
├── core/              # Core infrastructure
│   ├── auth/         # Authentication utilities
│   ├── database/     # Database client & schema
│   ├── middleware/   # Composable middleware
│   ├── errors/       # Custom error classes
│   └── utils/        # Core utilities
├── shared/           # Shared across features
│   ├── components/   # Reusable UI components
│   ├── hooks/        # Shared hooks
│   ├── types/        # Global types
│   ├── utils/        # Utility functions
│   └── constants/    # App-wide constants
└── features/         # Feature modules
    ├── forum/        # Forum with service/repository pattern
    ├── projects/
    ├── bounties/
    ├── meeting-notes/
    └── members/
```

### Path Aliases

Use these aliases for clean imports:
- `@core/*` - Core infrastructure (`src/core/*`)
- `@shared/*` - Shared modules (`src/shared/*`)
- `@features/*` - Feature modules (`src/features/*`)
- `@components/*` - UI components (`src/shared/components/*`)
- `@hooks/*` - Shared hooks (`src/shared/hooks/*`)
- `@utils/*` - Utilities (`src/shared/utils/*`)
- `@types/*` - Type definitions (`src/shared/types/*`)

### Authentication Flow
1. **Client-side**: PrivyProvider wraps the app in `pages/_app.tsx` with embedded wallet configuration
2. **Protected routes**: Pages check authentication status using `usePrivy` hook and redirect if not authenticated
3. **Server verification**: API endpoints use `withAuth` middleware from `@core/middleware`
4. **User sync**: Users are automatically created in database on first API interaction

### Database Architecture
- **ORM**: Drizzle ORM with Turso (distributed SQLite)
- **Schema**: Located in `src/core/database/schema.ts` with tables:
  - `users` - Synced from Privy authentication
  - `members` - DAO membership with voting power and badges
  - `forum_posts` - Community discussions with nested replies
  - `projects` - Civic Innovation Lab proposals (requires GitHub repo)
  - `meeting_notes` - DAO meeting documentation
  - `forum_votes` - Upvote/downvote system
  - `documents` - IPFS document management
  - `innovation_bounties` - Bounty system
- **Type Safety**: Full TypeScript support with centralized types in `src/shared/types/`
- **ID Generation**: All IDs use UUIDv7 for time-sortable, globally unique identifiers
  - Centralized in `src/shared/utils/id-generator.ts`
  - Import via `import { generateId } from '@utils/id-generator'`
  - UUIDv7 provides chronological sorting while maintaining UUID uniqueness guarantees

### Key API Endpoints
- `/api/verify` - Validates Privy auth tokens server-side
- `/api/forums/posts` - CRUD operations for forum posts
- `/api/forums/posts/[id]/vote` - Vote on forum posts
- `/api/projects` - Manage Innovation Lab projects
- `/api/users/profile` - User profile management
- `/api/meeting-notes` - DAO meeting documentation

### Component Structure
- `pages/` - Next.js page components (dashboard, forums, innovation-lab, meeting-notes)
- `src/shared/components/` - Reusable UI components (migrated from `components/`)
  - `ui/` - Base components (button, dropdown-menu, sheet, scroll-area)
  - `AppLayout.tsx` - Main layout wrapper with navigation
  - `navbar.tsx` - Navigation component
- `src/core/database/` - Database layer with schema and query helpers
- `src/shared/utils/` - Utility functions (migrated from `lib/`)
- `src/features/` - Feature-based modules with service/repository pattern

### API Route Pattern

New API routes should follow the middleware composition pattern:

```typescript
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

export default compose(
  errorHandler,
  withAuth
)(handler);
```

See `docs/API_EXAMPLE_REFACTORED.md` for detailed examples.

### Key Features
The platform includes:
1. **Forums** - Category-based discussions with voting and nested replies
2. **Innovation Lab** - Project proposals linked to GitHub repositories
3. **Meeting Notes** - Searchable DAO meeting documentation with tags
4. **Member Profiles** - Track contributions, voting power, and earned badges
5. **Multi-auth Support** - Email, wallet, Google, Twitter, Discord authentication

## Important Implementation Details

### General Patterns
- **ID Generation**: Always use `generateId()` from `@utils/id-generator` for all new database records. This ensures consistent UUIDv7 format across the application
- **Error Handling**: Use custom error classes from `@core/errors` (AppError, NotFoundError, ValidationError, UnauthorizedError)
- **API Responses**: Use `apiResponse` helpers from `@core/utils` for consistent API responses
- **Validation**: Use Zod schemas for runtime validation (see `src/features/forum/types/` for examples)
- **Middleware**: Always use middleware composition with `compose()` from `@core/middleware`

### Authentication & Security
- Embedded wallets are created automatically on login for all users
- Authentication state is checked in `useEffect` to handle client-side redirects
- The app prevents unlinking the last authentication method
- All API routes should use `withAuth` middleware for authentication
- All database operations use prepared statements for security

### Feature Development
- New features should follow the service/repository pattern (see `src/features/forum/` for reference)
- Business logic belongs in service classes, not API routes
- Data access belongs in repository classes
- Types and validation schemas belong in feature `types/` directory
- Use constants from `@shared/constants` for API routes and validation limits

### Legacy Code
- Custom Adelle Sans font family is preloaded for performance
- User creation happens automatically via database client operations
- Forum posts support markdown formatting
- Projects require a valid GitHub repository URL
- Meeting notes include automatic date tracking and tag categorization

### Migration Notes
- Old imports from `lib/`, `src/db/`, `components/`, `hooks/` still work during migration
- Prefer new path aliases (`@core/*`, `@shared/*`, `@features/*`) for new code
- See `docs/MIGRATION_STATUS.md` for refactoring progress and guidelines