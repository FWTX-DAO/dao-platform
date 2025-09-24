import { ReactNode, memo } from 'react';
import Head from 'next/head';
import Navbar from './navbar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

function AppLayout({ children, title = 'Fort Worth TX DAO' }: AppLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pb-safe">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default memo(AppLayout);