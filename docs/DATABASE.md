# Database Setup Guide

This project uses **Turso** (distributed SQLite) with **Drizzle ORM** for type-safe database operations.

## Overview

- **Database**: Turso (SQLite at the edge)
- **ORM**: Drizzle ORM
- **Type Safety**: Full TypeScript support with auto-generated types
- **Identity Provider**: Privy (users auto-sync on first login)

## Initial Setup

### 1. Create a Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Sign up/login
turso auth login

# Create a new database
turso db create fwtx-dao

# Get your database URL
turso db show fwtx-dao --url

# Create an auth token
turso db tokens create fwtx-dao
```

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

### 3. Initialize the Database

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to database
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

## Database Commands

```bash
# Generate SQL migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

## Architecture

### Schema Location
- Schema definitions: `src/db/schema.ts`
- Database connection: `src/db/index.ts`
- Query helpers: `src/db/queries/`

### User Management
Users are automatically created when they first authenticate with Privy. The system:
1. Checks if a user exists with the Privy DID
2. If not, creates a new user with default values
3. Uses email username as default username (before @)
4. All subsequent operations use this user record

### Tables

1. **users** - Syncs with Privy authentication
   - `privyDid` - Unique identifier from Privy
   - `username`, `bio`, `avatarUrl` - Profile data

2. **forum_posts** - Community discussions
   - Supports nested replies via `parentId`
   - Categories: General, Governance, Technical, Events, Education

3. **projects** - Civic Innovation Lab projects
   - Requires GitHub repo link
   - Must define benefit to Fort Worth
   - Status: proposed, active, completed

4. **meeting_notes** - DAO meeting documentation
   - Tracks attendees, agenda, action items
   - Searchable by tags

5. **forum_votes** - Upvote/downvote system

6. **project_collaborators** - Project team members

## Type Safety

Drizzle automatically generates TypeScript types from your schema:

```typescript
import { User, ForumPost, Project } from '@/src/db';

// Types are inferred from schema
const user: User = await getOrCreateUser(privyDid);
```

## Migrations

When you modify the schema:

1. Update `src/db/schema.ts`
2. Run `npm run db:generate` to create migration SQL
3. Run `npm run db:push` to apply changes

## Troubleshooting

### "no such table" Error
Run `npm run db:push` to create tables from schema.

### Connection Issues
- Verify your Turso database is active: `turso db list`
- Check auth token is valid: `turso db tokens list fwtx-dao`
- Ensure environment variables are loaded

### Development Tips
- Use `npm run db:studio` to visually inspect data
- Check `migrations/` folder for generated SQL
- Drizzle config is in `drizzle.config.ts`

## Production Considerations

1. **Never commit `.env.local`** - Contains sensitive credentials
2. **Use migrations in production** - Don't use `db:push`
3. **Backup regularly** - Turso provides automatic backups
4. **Monitor usage** - Check Turso dashboard for metrics

## Resources

- [Turso Documentation](https://docs.turso.tech/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle with Turso Guide](https://orm.drizzle.team/docs/tutorials/drizzle-with-turso)