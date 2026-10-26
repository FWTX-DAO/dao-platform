import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Privy CSP guidance: https://docs.privy.io/security/implementation-guide/content-security-policy
// Ships as Report-Only until violations are reviewed (see /api/csp-report logs).
// Set CSP_MODE=enforce in the Netlify env and redeploy to enforce it.
// If a Privy custom auth domain (HttpOnly cookies) is enabled, add it to
// child-src, frame-src and connect-src.
const PRIVY_FRAMES = [
  'https://auth.privy.io',
  'https://verify.walletconnect.com',
  'https://verify.walletconnect.org',
];

const csp = [
  "default-src 'self'",
  // Next.js App Router injects inline bootstrap scripts, so 'unsafe-inline' is
  // required without per-request nonces (which would disable static caching).
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `child-src ${PRIVY_FRAMES.join(' ')}`,
  `frame-src ${PRIVY_FRAMES.join(' ')} https://challenges.cloudflare.com`,
  [
    "connect-src 'self'",
    'https://auth.privy.io',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'wss://www.walletlink.org',
    'https://*.rpc.privy.systems',
    'https://explorer-api.walletconnect.com',
    // Solana embedded wallets use the public cluster endpoints (no RPC override)
    'https://api.mainnet-beta.solana.com',
    'https://api.devnet.solana.com',
    'https://api.testnet.solana.com',
    ...(isDev ? ['ws://localhost:*'] : []),
  ].join(' '),
  "worker-src 'self'",
  "manifest-src 'self'",
  'report-uri /api/csp-report',
].join('; ');

const securityHeaders = [
  {
    key:
      process.env.CSP_MODE === 'enforce'
        ? 'Content-Security-Policy'
        : 'Content-Security-Policy-Report-Only',
    value: csp,
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
    ],
  },
};

export default nextConfig;
