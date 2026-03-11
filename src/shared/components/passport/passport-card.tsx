'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import type { PassportData } from './types';

function truncateWallet(addr: string | null): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

interface PassportCardProps {
  data: PassportData;
}

export function PassportCard({ data }: PassportCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const displayName =
    data.firstName && data.lastName
      ? `${data.firstName} ${data.lastName}`
      : data.username || 'Member';

  return (
    <Link href="/passport">
      <motion.div
        whileHover={shouldReduceMotion ? undefined : { rotateX: -3, rotateY: 5, scale: 1.02 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 20 }}
        className="relative w-40 h-52 rounded-md overflow-hidden cursor-pointer border border-dao-gold/20"
        style={{
          perspective: '600px',
          background: 'linear-gradient(145deg, #1a2744 0%, #0f1b33 50%, #1a2744 100%)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Inner border */}
        <div className="absolute inset-1.5 border border-dao-gold/10 rounded-xs" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-3 text-center">
          {/* Mini logo */}
          <div className="w-8 h-8 mb-3 opacity-60">
            <Image src="/logo.svg" alt="" width={32} height={32} />
          </div>

          {/* Name */}
          <span className="text-dao-warm text-xs font-semibold truncate w-full">
            {displayName}
          </span>

          {/* Membership badge */}
          <span className="mt-1.5 px-2 py-0.5 text-[8px] uppercase tracking-widest text-dao-gold bg-dao-gold/10 rounded-full">
            {data.tierDisplayName || data.membershipType || 'Member'}
          </span>

          {/* Wallet */}
          {data.walletAddress && (
            <span className="mt-2 text-[9px] font-mono text-dao-cool/50 truncate w-full">
              {truncateWallet(data.walletAddress)}
            </span>
          )}
        </div>

        {/* Bottom line */}
        <div className="absolute bottom-3 left-4 right-4 h-px bg-linear-to-r from-transparent via-dao-gold/15 to-transparent" />
      </motion.div>
    </Link>
  );
}
