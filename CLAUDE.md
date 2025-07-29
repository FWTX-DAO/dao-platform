# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application using the Pages Router that demonstrates Privy Auth integration. It provides authentication through various providers (email, wallet, Google, Twitter, Discord) and includes examples of both client-side and server-side authentication verification.

## Key Technologies

- **Next.js** (Pages Router) - React framework
- **TypeScript** - Type-safe JavaScript
- **Privy Auth** (@privy-io/react-auth, @privy-io/server-auth) - Authentication provider
- **Tailwind CSS** - Utility-first CSS framework
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
```

## Environment Setup

Create `.env.local` file with:
```
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>
```

## Architecture Overview

### Authentication Flow
1. **Client-side**: PrivyProvider wraps the app in `pages/_app.tsx` with embedded wallet configuration
2. **Protected routes**: Dashboard checks authentication status using `usePrivy` hook and redirects if not authenticated
3. **Server verification**: API endpoint at `/api/verify` validates auth tokens from headers or cookies

### Key API Endpoints
- `/api/verify` - Validates Privy auth tokens server-side
- `/api/ethereum/personal_sign.ts` - Ethereum message signing
- `/api/solana/sign_message.ts` - Solana message signing

### Component Structure
- `pages/` - Next.js page components
- `components/` - Reusable UI components (WalletCard, WalletList, etc.)
- `styles/` - Global CSS and Tailwind configuration

### Authentication Features
The dashboard (`pages/dashboard.tsx`) demonstrates:
- Linking/unlinking multiple auth methods (email, phone, wallet, social)
- Displaying user object and linked accounts
- Server-side token verification
- Wallet interaction components

## Important Implementation Details

- Embedded wallets are created automatically on login for all users
- Authentication state is checked in `useEffect` to handle client-side redirects
- The app prevents unlinking the last authentication method
- Custom fonts are preloaded in `_app.tsx` for performance