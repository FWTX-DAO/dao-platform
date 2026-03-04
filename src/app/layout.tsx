import type { Metadata } from 'next';
import { Providers } from './_providers/privy-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fort Worth DAO - Digital Sovereignty is Mission Critical',
  description:
    "Fort Worth's Civic Innovation Lab advancing digital sovereignty through Web3, blockchain, and emerging technologies. We empower communities with cryptographic governance tools, Bitcoin education, and AI literacy to build resilient, decentralized civic infrastructure for North Texas.",
  keywords:
    'Fort Worth, Web3, crypto, Bitcoin, blockchain, emerging tech, AI, digital sovereignty, civic innovation, cryptographic governance, Fort Worth DAO, North Texas, decentralized governance, civic technology',
  authors: [{ name: 'Fort Worth DAO' }],
  openGraph: {
    type: 'website',
    url: 'https://fwtx.city/',
    title: 'Fort Worth DAO - Digital Sovereignty is Mission Critical',
    description:
      "Fort Worth's Civic Innovation Lab advancing digital sovereignty through Web3, blockchain, and emerging technologies. We empower communities with cryptographic governance tools, Bitcoin education, and AI literacy.",
    images: [{ url: '/ogimage.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fort Worth DAO - Digital Sovereignty is Mission Critical',
    description:
      "Fort Worth's Civic Innovation Lab advancing digital sovereignty through Web3, blockchain, and emerging technologies. We empower communities with cryptographic governance tools, Bitcoin education, and AI literacy.",
    images: ['/ogimage.png'],
  },
  icons: {
    icon: { url: '/logo.svg', type: 'image/svg+xml' },
    apple: '/favicons/apple-touch-icon.png',
  },
  manifest: '/favicons/manifest.json',
  other: {
    'theme-color': '#7c3aed',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link rel="preload" href="/fonts/AdelleSans-Regular.woff2" as="font" crossOrigin="" />
        <link rel="preload" href="/fonts/AdelleSans-Regular.woff" as="font" crossOrigin="" />
        <link rel="preload" href="/fonts/AdelleSans-Semibold.woff2" as="font" crossOrigin="" />
        <link rel="preload" href="/fonts/AdelleSans-Semibold.woff" as="font" crossOrigin="" />
        <link rel="canonical" href="https://fwtx.city/" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
