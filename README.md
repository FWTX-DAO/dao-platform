# FWTX DAO Platform

A Next.js application powering the Fort Worth Civic Innovation DAO platform. Enables community-driven governance, project proposals, bounty programs, and collaborative decision-making for civic innovation initiatives.

## Features

- **Multi-Provider Authentication** - Email, wallet, Google, Twitter, and Discord via Privy Auth with embedded wallets
- **Community Forums** - Category-based discussions with voting, nested replies, and pinned/locked threads
- **Innovation Lab** - Submit and track civic innovation project proposals linked to GitHub repositories
- **Innovation Bounties** - Organizations post civic challenges; members submit proposals with screening workflow
- **Passport Stamps** - Event attendance tracking and contribution point system
- **Meeting Notes** - Searchable documentation of DAO meetings with automatic categorization
- **Document Management** - IPFS-backed file storage via Pinata with audit trail and sharing
- **Membership Tiers** - Free/Pro/Annual plans with Stripe billing integration
- **RBAC** - Role-based access control with granular permissions (admin, council member, screener)
- **Member Profiles** - Track contributions, voting power, badges, and onboarding status

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Runtime**: [Bun](https://bun.sh/)
- **Authentication**: [Privy Auth](https://www.privy.io/)
- **Database**: PostgreSQL ([PlanetScale](https://planetscale.com/)) with [Drizzle ORM](https://orm.drizzle.team/)
- **Payments**: [Stripe](https://stripe.com/) subscriptions and checkout
- **File Storage**: [Pinata](https://pinata.cloud/) (IPFS)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Radix UI](https://www.radix-ui.com/) and [Headless UI](https://headlessui.com/)
- **State Management**: [TanStack React Query](https://tanstack.com/query)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## Prerequisites

- Node.js >= 20.9.0
- [Bun](https://bun.sh/) runtime
- A Privy account for authentication
- A PostgreSQL database (PlanetScale)

## Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/fwtx-dao-platform.git
cd fwtx-dao-platform
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Privy Authentication (Required)
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>

# Database (Required)
DATABASE_URL=<your-postgresql-connection-string>

# Pinata IPFS Storage (Required)
PINATA_JWT=<your-pinata-jwt>
PINATA_GATEWAY=<your-pinata-gateway>
PINATA_GATEWAY_KEY=<your-pinata-gateway-key>

# Stripe Payments (Required for subscriptions)
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
```

4. **Set up the database**
```bash
# Push schema directly to database
bun run db:push

# Seed RBAC tiers, roles, and permissions
bun run db:seed-rbac
```

5. **Start the development server**
```bash
bun dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app.

## Development Commands

```bash
bun dev              # Start development server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # ESLint + Prettier check + TypeScript check
bun run format       # Format code with Prettier
```

### Database Commands

```bash
bun run db:generate  # Generate migrations from schema changes
bun run db:push      # Push schema directly to database
bun run db:studio    # Open Drizzle Studio GUI
bun run db:seed      # Seed sample data
bun run db:seed-rbac # Seed RBAC tiers, roles, permissions
```

## Project Structure

```
src/
├── app/
│   ├── _lib/              # Auth helpers (auth.ts), action utilities
│   ├── _actions/          # Server actions (bounties, forum, projects, etc.)
│   ├── _services/         # Service/repository modules
│   │   ├── activities/    # Activity tracking
│   │   ├── forum/         # Forum posts and votes
│   │   ├── members/       # Member profiles and onboarding
│   │   ├── rbac/          # Roles and permissions
│   │   └── subscriptions/ # Stripe subscription management
│   ├── _providers/        # PrivyProvider, QueryClientProvider
│   ├── (platform)/        # Authenticated pages (dashboard, forums, bounties, etc.)
│   ├── (auth)/            # Auth pages (onboarding)
│   └── api/               # API routes (Stripe webhooks, checkout)
├── core/
│   ├── database/          # Schema, client, seed scripts
│   ├── middleware/         # compose, withAuth, errorHandler
│   ├── errors/            # AppError, NotFoundError, ValidationError, etc.
│   └── utils/             # apiResponse helpers
└── shared/
    ├── components/        # UI components (Sidebar, Passport, ActivityFeed, etc.)
    ├── hooks/             # React Query hooks + useAuthReady
    ├── types/             # Global TypeScript types
    ├── utils/             # id-generator, cn, query-client
    └── constants/         # Query keys, validation limits
```

## Database Schema (23 tables)

| Group | Tables |
|-------|--------|
| **Core** | `users`, `members`, `forum_posts`, `forum_votes`, `projects`, `project_collaborators`, `project_updates`, `meeting_notes` |
| **Documents** | `documents`, `document_audit_trail`, `document_shares` |
| **Bounties** | `innovation_bounties`, `bounty_proposals`, `bounty_comments` |
| **Membership** | `membership_tiers`, `subscriptions`, `payment_history` |
| **RBAC** | `roles`, `permissions`, `role_permissions`, `member_roles` |
| **Activity** | `member_activities` |
| **Passport** | `passport_stamps` |

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

[MIT License](LICENSE)

---

Built for Fort Worth civic innovation
