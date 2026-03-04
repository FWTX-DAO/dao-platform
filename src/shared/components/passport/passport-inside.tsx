'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import type { PassportData } from './types';
import { generateMRZ } from './mrz-generator';
import { GuillochePattern, PassportWatermark, SecurityBorder } from './passport-patterns';

function truncateWallet(addr: string | null): string {
  if (!addr) return '---';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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

  return (
    <div
      className={`relative rounded-md overflow-hidden w-72 sm:w-80 ${className}`}
      style={{
        aspectRatio: '3/4',
        background: 'linear-gradient(180deg, #faf8f5 0%, #f4efe8 100%)',
      }}
    >
      <GuillochePattern />
      <PassportWatermark />
      <SecurityBorder />

      <div className="relative z-10 flex flex-col h-full p-5 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] tracking-[0.25em] uppercase text-dao-gold-muted font-semibold">
            Fort Worth DAO
          </span>
          <span className="text-[9px] tracking-wider uppercase text-dao-cool/50">
            Passport
          </span>
        </div>

        {/* Main content: photo + fields */}
        <div className="flex gap-4 mb-3">
          {/* Photo */}
          <div className="w-[35%] flex-shrink-0">
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
                  <User className="w-10 h-10 text-dao-cool/30" />
                </div>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-1.5">
            <FieldRow label="TYPE / CODE" value="P / FWTX" />
            <FieldRow label="SURNAME" value={(data.lastName || '---').toUpperCase()} />
            <FieldRow label="GIVEN NAMES" value={(data.firstName || '---').toUpperCase()} />
            <FieldRow label="PASSPORT NO." value={data.memberId.slice(0, 9).toUpperCase()} />
            <FieldRow label="MEMBERSHIP" value={(data.tierDisplayName || data.membershipType || 'Member').toUpperCase()} />
            <FieldRow label="DATE OF ISSUE" value={formatDate(data.joinedAt)} />
            <FieldRow label="AUTHORITY" value="FORT WORTH DAO" />
            <FieldRow label="ON-CHAIN" value={truncateWallet(data.walletAddress)} mono />
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {badges.map((badge) => (
              <span
                key={badge}
                className="px-1.5 py-0.5 text-[8px] uppercase tracking-wide bg-dao-surface/8 border border-dao-border/20 rounded text-dao-cool/70"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* MRZ Zone */}
        <div className="mt-auto bg-dao-charcoal/5 border-t border-dao-border/15 -mx-5 -mb-5 px-4 py-3">
          <div className="font-mono text-[10px] leading-relaxed tracking-[0.15em] text-dao-charcoal/50 select-all">
            <div>{mrz1}</div>
            <div>{mrz2}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[7px] tracking-[0.15em] uppercase text-dao-cool/50 leading-none">
        {label}
      </div>
      <div
        className={`text-[11px] text-dao-charcoal/80 leading-tight font-semibold ${
          mono ? 'font-mono text-[10px]' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
