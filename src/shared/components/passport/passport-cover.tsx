'use client';

import Image from 'next/image';

const sizes = {
  sm: 'w-40 h-52',
  md: 'w-56 h-72',
  lg: 'w-72 h-96',
} as const;

interface PassportCoverProps {
  size?: keyof typeof sizes;
  className?: string;
}

export function PassportCover({ size = 'md', className = '' }: PassportCoverProps) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-md overflow-hidden ${sizes[size]} ${className}`}
      style={{
        background: `
          linear-gradient(145deg, #1a2744 0%, #0f1b33 50%, #1a2744 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Leather-like texture noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px',
        }}
      />

      {/* Subtle border glow */}
      <div className="absolute inset-0 border border-dao-gold/15 rounded-md" />
      <div className="absolute inset-1 border border-dao-gold/8 rounded-sm" />

      {/* PASSPORT text */}
      <span className="relative text-dao-gold tracking-[0.3em] uppercase font-display text-xs mb-6 select-none">
        Passport
      </span>

      {/* DAO Logo */}
      <div className="relative w-16 h-16 mb-5">
        <Image
          src="/logo.svg"
          alt="Fort Worth DAO"
          width={64}
          height={64}
          className="opacity-80"
        />
      </div>

      {/* DAO Name */}
      <span className="relative text-dao-gold/90 tracking-[0.15em] uppercase text-[10px] font-semibold select-none">
        Fort Worth DAO
      </span>

      {/* Bottom emboss line */}
      <div className="absolute bottom-4 left-6 right-6 h-px bg-gradient-to-r from-transparent via-dao-gold/20 to-transparent" />
    </div>
  );
}
