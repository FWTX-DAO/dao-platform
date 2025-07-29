import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PrivyProvider } from "@privy-io/react-auth";

function MyApp({ Component, pageProps }: AppProps) {
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
        <link rel="icon" href="/favicons/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
        <link rel="manifest" href="/favicons/manifest.json" />

        <title>Fort Worth DAO - Digital Sovereignty is Mission Critical</title>
        <meta name="description" content="Emerging Tech Workshops, Community, and Civic Innovation Lab for North Texas. Growing Web3 Civic Excellence through education on cryptographic governance, civil rights, and the social impacts of AI." />
        <meta name="keywords" content="Fort Worth DAO, Web3, blockchain, civic innovation, digital sovereignty, cryptographic governance, AI ethics, North Texas tech" />
        <meta name="author" content="Fort Worth DAO" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fwtx.city/" />
        <meta property="og:title" content="Fort Worth DAO - Digital Sovereignty is Mission Critical" />
        <meta property="og:description" content="Emerging Tech Workshops, Community, and Civic Innovation Lab for North Texas" />
        <meta property="og:image" content="/ogimage.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://fwtx.city/" />
        <meta property="twitter:title" content="Fort Worth DAO - Digital Sovereignty is Mission Critical" />
        <meta property="twitter:description" content="Emerging Tech Workshops, Community, and Civic Innovation Lab for North Texas" />
        <meta property="twitter:image" content="/ogimage.png" />
        
        {/* Additional Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="canonical" href="https://fwtx.city/" />
      </Head>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          embeddedWallets: {
            createOnLogin: "all-users",
          },
        }}
      >
        <Component {...pageProps} />
      </PrivyProvider>
    </>
  );
}

export default MyApp;
