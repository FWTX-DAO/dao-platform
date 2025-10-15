import { ReactNode, memo } from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

function AppLayout({ children, title = 'Fort Worth TX DAO' }: AppLayoutProps) {
  const { isOpen } = useSidebar();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Sidebar />
        <main
          className={`pt-20 sm:pt-22 lg:pt-24 pb-8 transition-all duration-300 ease-in-out ${
            isOpen ? 'md:ml-64' : 'md:ml-0'
          }`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}

export default memo(AppLayout);