'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import type { PassportData } from './types';
import { generateMRZ } from './mrz-generator';
import { GuillochePattern, PassportWatermark, SecurityBorder } from './passport-patterns';
import { PassportStamps } from './passport-stamps';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format UUIDv7 as a passport-style document number: uppercase, no dashes */
function formatPassportNo(memberId: string): string {
  return memberId.replace(/-/g, '').toUpperCase();
}

interface PassportInsideProps {
  data: PassportData;
  className?: string;
}

export function PassportInside({ data, className = '' }: PassportInsideProps) {
  const [mrz1, mrz2] = generateMRZ(data);
  const skills = data.skills?.split(',').map((s) => s.trim()).filter(Boolean) || [];
  const interests = data.civicInterests?.split(',').map((s) => s.trim()).filter(Boolean) || [];
  const badges = [...skills, ...interests].slice(0, 6);

  const joinDate = new Date(data.joinedAt);
  const joinDay = joinDate.toLocaleDateString('en-US', { day: '2-digit' });
  const joinMonth = joinDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const joinYear = joinDate.toLocaleDateString('en-US', { year: 'numeric' });

  const passportNo = formatPassportNo(data.memberId);

  return (
    <div
      className={`relative rounded-md overflow-hidden ${className}`}
      style={{
        aspectRatio: '3/2',
        background: 'linear-gradient(135deg, #faf8f5 0%, #f4efe8 50%, #f0ebe2 100%)',
      }}
    >
      <GuillochePattern />
      <PassportWatermark />
      <SecurityBorder />

      <div className="relative z-10 flex flex-col h-full p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[8px] sm:text-[9px] tracking-[0.25em] uppercase text-dao-gold-muted font-semibold">
            Fort Worth DAO
          </span>
          <span className="text-[8px] sm:text-[9px] tracking-wider uppercase text-dao-cool/50">
            Passport
          </span>
        </div>

        {/* Main content: photo left, fields right */}
        <div className="flex gap-3 sm:gap-5 flex-1 min-h-0">
          {/* Photo column */}
          <div className="w-[28%] sm:w-[25%] flex-shrink-0 flex flex-col">
            <div
              className="w-full bg-dao-surface/10 border border-dao-border/30 rounded overflow-hidden flex items-center justify-center"
              style={{ aspectRatio: '3/4' }}
            >
              {data.avatarUrl ? (
                <Image
                  src={data.avatarUrl}
                  alt="Member photo"
                  width={120}
                  height={160}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-dao-surface/5">
                  <User aria-hidden="true" className="w-8 h-8 sm:w-10 sm:h-10 text-dao-cool/30" />
                </div>
              )}
            </div>
            {/* Badges under photo */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-0.5 mt-2">
                {badges.slice(0, 4).map((badge) => (
                  <span
                    key={badge}
                    className="px-1 py-px text-[6px] sm:text-[7px] uppercase tracking-wide bg-dao-surface/8 border border-dao-border/20 rounded text-dao-cool/60 leading-tight"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Fields column */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Row 1: Type/Code + Passport No. */}
            <div className="flex gap-3 sm:gap-6 mb-1.5">
              <FieldRow label="Type / Code" value="P / FWTX" />
              <div className="flex-1 min-w-0">
                <div className="text-[6px] sm:text-[7px] tracking-[0.15em] uppercase text-dao-cool/50 leading-none">
                  Passport No.
                </div>
                <div className="text-[9px] sm:text-[10px] font-mono text-dao-charcoal/80 leading-tight font-semibold truncate">
                  {passportNo}
                </div>
              </div>
            </div>

            {/* Surname */}
            <FieldRow label="Surname" value={(data.lastName || '---').toUpperCase()} className="mb-1" />

            {/* Given Names */}
            <FieldRow label="Given Names" value={(data.firstName || '---').toUpperCase()} className="mb-1.5" />

            {/* Row: Membership + Date of Issue */}
            <div className="flex gap-3 sm:gap-6 mb-1">
              <FieldRow label="Membership" value={(data.tierDisplayName || data.membershipType || 'Member').toUpperCase()} />
              <FieldRow label="Date of Issue" value={formatDate(data.joinedAt)} suppressHydrationWarning />
            </div>

            {/* Authority */}
            <FieldRow label="Authority" value="FORT WORTH DAO" className="mb-1.5" />

            {/* Bottom area: event stamps + JOINED stamp */}
            <div className="flex items-end justify-between mt-auto">
              {data.stamps && data.stamps.length > 0 && (
                <div className="flex gap-1 items-end">
                  <PassportStamps stamps={data.stamps} compact />
                </div>
              )}

              {/* JOINED stamp */}
              <div
                className="flex-shrink-0 ml-auto"
                suppressHydrationWarning
                style={{ transform: 'rotate(-8deg)' }}
              >
                <div
                  className="relative w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] rounded-full border-[2px] border-dashed flex flex-col items-center justify-center"
                  style={{ borderColor: 'rgba(196, 150, 58, 0.5)' }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(196, 150, 58, 0.04)' }}
                  />
                  <span className="relative text-[6px] sm:text-[7px] font-bold tracking-[0.2em] uppercase" style={{ color: 'rgba(196, 150, 58, 0.7)' }}>
                    Joined
                  </span>
                  <span className="relative text-[11px] sm:text-[13px] font-bold leading-none mt-px" style={{ color: 'rgba(196, 150, 58, 0.8)' }}>
                    {joinDay}
                  </span>
                  <span className="relative text-[7px] sm:text-[8px] font-semibold tracking-wider uppercase leading-none mt-0.5" style={{ color: 'rgba(196, 150, 58, 0.65)' }}>
                    {joinMonth} {joinYear}
                  </span>
                  <span className="relative text-[4px] sm:text-[5px] tracking-[0.15em] uppercase mt-0.5 leading-none" style={{ color: 'rgba(196, 150, 58, 0.45)' }}>
                    FWTX DAO
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom zone: MRZ + wallet address */}
        <div className="mt-auto bg-dao-charcoal/5 border-t border-dao-border/15 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-3 sm:px-4 py-2 sm:py-2.5">
          <div className="font-mono text-[8px] sm:text-[9px] leading-relaxed tracking-[0.12em] sm:tracking-[0.15em] text-dao-charcoal/50 select-all tabular-nums overflow-hidden">
            <div className="truncate">{mrz1}</div>
            <div className="truncate">{mrz2}</div>
          </div>
          {/* Full embedded wallet address */}
          {data.walletAddress && (
            <div className="mt-1 pt-1 border-t border-dao-border/10">
              <div className="font-mono text-[7px] sm:text-[8px] tracking-[0.08em] text-dao-charcoal/40 select-all break-all leading-snug">
                {data.walletAddress}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
  suppressHydrationWarning = false,
  className = '',
}: {
  label: string;
  value: string;
  mono?: boolean;
  suppressHydrationWarning?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[6px] sm:text-[7px] tracking-[0.15em] uppercase text-dao-cool/50 leading-none">
        {label}
      </div>
      <div
        suppressHydrationWarning={suppressHydrationWarning}
        className={`text-[10px] sm:text-[11px] text-dao-charcoal/80 leading-tight font-semibold ${
          mono ? 'font-mono text-[9px] sm:text-[10px]' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
