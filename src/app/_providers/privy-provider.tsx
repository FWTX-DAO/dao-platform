'use client';

import { useState, type ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { createQueryClient } from '@utils/query-client';
import { SidebarProvider } from '@shared/contexts/SidebarContext';

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
);

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
        config={{
          embeddedWallets: {
            ethereum: { createOnLogin: 'all-users' },
            solana: { createOnLogin: 'all-users' },
          },
        }}
      >
        <SidebarProvider>
          {children}
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
        </SidebarProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}
