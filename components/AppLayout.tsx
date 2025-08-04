import { ReactNode } from 'react';
import Navbar from './navbar';
import Head from 'next/head';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title = 'Fort Worth TX DAO' }: AppLayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}