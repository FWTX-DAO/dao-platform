'use client';

import { type ReactNode } from 'react';
import Navbar from '@components/navbar';
import Sidebar from '@components/Sidebar';
import { useSidebar } from '@shared/contexts/SidebarContext';

export function PlatformShell({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <div className="min-h-screen bg-dao-cream">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-violet-500"
      >
        Skip to main content
      </a>
      <Navbar />
      <Sidebar />
      <main
        id="main-content"
        className={`pt-20 sm:pt-22 lg:pt-24 pb-8 transition-all duration-300 ease-in-out ${
          isOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
