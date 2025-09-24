import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { createQueryClient } from "../lib/query-client";

function MyApp({ Component, pageProps }: AppProps) {
  // Create a client with optimized settings
  const [queryClient] = useState(() => createQueryClient());

  return (
    <>
      <Head>
        <link
          rel="preload"
          href="/fonts/AdelleSans-Regular.woff"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/AdelleSans-Regular.woff2"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/AdelleSans-Semibold.woff"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/AdelleSans-Semibold.woff2"
          as="font"
          crossOrigin=""
        />

        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
        <link rel="manifest" href="/favicons/manifest.json" />

        <title>Fort Worth DAO - Digital Sovereignty is Mission Critical</title>
        <meta name="description" content="Fort Worth's Civic Innovation Lab advancing digital sovereignty through Web3, blockchain, and emerging technologies. We empower communities with cryptographic governance tools, Bitcoin education, and AI literacy to build resilient, decentralized civic infrastructure for North Texas." />
        <meta name="keywords" content="Fort Worth, Web3, crypto, Bitcoin, blockchain, emerging tech, AI, digital sovereignty, civic innovation, cryptographic governance, Fort Worth DAO, North Texas, decentralized governance, civic technology" />
        <meta name="author" content="Fort Worth DAO" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fwtx.city/" />
        <meta property="og:title" content="Fort Worth DAO - Digital Sovereignty is Mission Critical" />
        <meta property="og:description" content="Fort Worth's Civic Innovation Lab advancing digital sovereignty through Web3, blockchain, and emerging technologies. We empower communities with cryptographic governance tools, Bitcoin education, and AI literacy." />
        <meta property="og:image" content="/ogimage.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://fwtx.city/" />
        <meta property="twitter:title" content="Fort Worth DAO - Digital Sovereignty is Mission Critical" />
        <meta property="twitter:description" content="Fort Worth's Civic Innovation Lab advancing digital sovereignty through Web3, blockchain, and emerging technologies. We empower communities with cryptographic governance tools, Bitcoin education, and AI literacy." />
        <meta property="twitter:image" content="/ogimage.png" />
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="canonical" href="https://fwtx.city/" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
          config={{
            embeddedWallets: {
              createOnLogin: "all-users",
            },
          }}
        >
          <Component {...pageProps} />
          <ReactQueryDevtools initialIsOpen={false} />
        </PrivyProvider>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;
