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

### Authentication Flow
1. **Client-side**: PrivyProvider wraps the app in `pages/_app.tsx` with embedded wallet configuration
2. **Protected routes**: Pages check authentication status using `usePrivy` hook and redirect if not authenticated
3. **Server verification**: API endpoints validate auth tokens via `/api/verify` middleware
4. **User sync**: Users are automatically created in database on first API interaction

### Database Architecture
- **ORM**: Drizzle ORM with Turso (distributed SQLite)
- **Schema**: Located in `src/db/schema.ts` with 6 main tables:
  - `users` - Synced from Privy authentication
  - `members` - DAO membership with voting power and badges
  - `forum_posts` - Community discussions with nested replies
  - `projects` - Civic Innovation Lab proposals (requires GitHub repo)
  - `meeting_notes` - DAO meeting documentation
  - `forum_votes` - Upvote/downvote system
- **Type Safety**: Full TypeScript support with auto-generated types

### Key API Endpoints
- `/api/verify` - Validates Privy auth tokens server-side
- `/api/forums/posts` - CRUD operations for forum posts
- `/api/forums/posts/[id]/vote` - Vote on forum posts
- `/api/projects` - Manage Innovation Lab projects
- `/api/users/profile` - User profile management
- `/api/meeting-notes` - DAO meeting documentation

### Component Structure
- `pages/` - Next.js page components (dashboard, forums, innovation-lab, meeting-notes)
- `components/` - Reusable UI components
  - `ui/` - Base components (button, dropdown-menu, sheet, scroll-area)
  - `AppLayout.tsx` - Main layout wrapper with navigation
  - `navbar.tsx` - Navigation component
- `src/db/` - Database layer with schema and query helpers
- `lib/` - Utility functions (cn.ts for className management)

### Key Features
The platform includes:
1. **Forums** - Category-based discussions with voting and nested replies
2. **Innovation Lab** - Project proposals linked to GitHub repositories
3. **Meeting Notes** - Searchable DAO meeting documentation with tags
4. **Member Profiles** - Track contributions, voting power, and earned badges
5. **Multi-auth Support** - Email, wallet, Google, Twitter, Discord authentication

## Important Implementation Details

- Embedded wallets are created automatically on login for all users
- Authentication state is checked in `useEffect` to handle client-side redirects
- The app prevents unlinking the last authentication method
- Custom Adelle Sans font family is preloaded for performance
- All database operations use prepared statements for security
- User creation happens automatically via `getOrCreateUser` helper
- Forum posts support markdown formatting
- Projects require a valid GitHub repository URL
- Meeting notes include automatic date tracking and tag categorization