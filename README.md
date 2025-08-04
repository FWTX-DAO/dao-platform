# FWTX DAO Platform

A Next.js application powering the Fort Worth Civic Innovation DAO platform. This platform enables community-driven governance, project proposals, and collaborative decision-making for civic innovation initiatives.

## Features

- **Multi-Provider Authentication** - Secure login via email, wallet, Google, Twitter, and Discord through Privy Auth
- **Community Forums** - Category-based discussions with voting and nested replies
- **Innovation Lab** - Submit and track civic innovation project proposals linked to GitHub repositories
- **Meeting Notes** - Searchable documentation of DAO meetings with automatic categorization
- **Member Profiles** - Track contributions, voting power, and earned badges
- **Embedded Wallets** - Automatic wallet creation for all users

## Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) with Pages Router
- **Language**: TypeScript
- **Authentication**: [Privy Auth](https://www.privy.io/)
- **Database**: [Turso](https://turso.tech/) (Distributed SQLite) with [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/)
- **Deployment**: Optimized for edge deployment

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- A Privy account for authentication
- A Turso database instance

## Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/fwtx-dao-platform.git
cd fwtx-dao-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Privy Authentication (Required)
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>

# Database (Required)
TURSO_DATABASE_URL=<your-turso-database-url>
TURSO_AUTH_TOKEN=<your-turso-auth-token>

# Session Signers (Optional)
NEXT_PUBLIC_SESSION_SIGNER_ID=<your-session-signer-id>
SESSION_SIGNER_SECRET=<your-session-signer-secret>
```

4. **Set up the database**
```bash
# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

5. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint and TypeScript checks
npm run format       # Format code with Prettier
```

### Database Commands

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:push      # Apply schema to database
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed      # Seed sample data
```

## Project Structure

```
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── AppLayout.tsx   # Main layout wrapper
│   └── navbar.tsx      # Navigation component
├── pages/              # Next.js pages (routes)
│   ├── api/           # API endpoints
│   ├── dashboard.tsx   # Protected user dashboard
│   ├── forums.tsx      # Community discussions
│   ├── innovation-lab.tsx # Project proposals
│   └── meeting-notes.tsx  # Meeting documentation
├── src/
│   └── db/            # Database layer
│       ├── schema.ts  # Database schema
│       └── queries/   # Query helpers
├── lib/               # Utility functions
├── public/            # Static assets
└── styles/            # Global styles
```

## Key Pages

- **`/`** - Landing page with authentication
- **`/dashboard`** - User dashboard (protected)
- **`/forums`** - Community discussion forums
- **`/innovation-lab`** - Submit and view civic innovation projects
- **`/meeting-notes`** - DAO meeting documentation

## API Endpoints

- **`/api/verify`** - Validate authentication tokens
- **`/api/forums/posts`** - Forum post CRUD operations
- **`/api/projects`** - Innovation Lab project management
- **`/api/users/profile`** - User profile management
- **`/api/meeting-notes`** - Meeting notes CRUD

## Database Schema

The platform uses 6 main tables:
- `users` - User accounts synced from Privy
- `members` - DAO membership details
- `forum_posts` - Discussion posts
- `projects` - Innovation Lab proposals
- `meeting_notes` - Meeting documentation
- `forum_votes` - Post voting system

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

[MIT License](LICENSE)

## Support

For questions or issues:
- Check the [documentation](docs/)
- Open an [issue](https://github.com/your-org/fwtx-dao-platform/issues)
- Contact the development team

---

Built with ❤️ for Fort Worth civic innovation