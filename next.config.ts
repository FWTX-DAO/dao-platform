import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
