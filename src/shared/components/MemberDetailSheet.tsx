'use client';

import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@components/ui/sheet';
import {
  User,
  Shield,
  Crown,
  Star,
  MapPin,
  Briefcase,
  Wallet,
  Calendar,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import type { Member } from '@hooks/useMembers';

interface MemberDetailSheetProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseJsonField(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map(String) : [val];
    } catch {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}

export function MemberDetailSheet({ member, open, onOpenChange }: MemberDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  const copyWallet = useCallback(() => {
    if (!member?.walletAddress) return;
    navigator.clipboard.writeText(member.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [member?.walletAddress]);

  if (!member) return null;

  const displayName =
    member.firstName && member.lastName
      ? `${member.firstName} ${member.lastName}`
      : member.username || 'Anonymous Member';
  const subtitle = member.username && member.firstName ? `@${member.username}` : null;
  const location = [member.city, member.state].filter(Boolean).join(', ');
  const jobLine = [member.jobTitle, member.employer].filter(Boolean).join(' at ');
  const skills = parseJsonField(member.skills);
  const interests = parseJsonField(member.civicInterests);
  const socials = [
    member.linkedinUrl && { href: member.linkedinUrl, label: 'LinkedIn' },
    member.twitterUrl && { href: member.twitterUrl, label: 'Twitter' },
    member.githubUrl && { href: member.githubUrl, label: 'GitHub' },
    member.websiteUrl && { href: member.websiteUrl, label: 'Website' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-white">
        <SheetHeader className="sr-only">
          <SheetTitle>{displayName}</SheetTitle>
          <SheetDescription>Member profile details</SheetDescription>
        </SheetHeader>

        {/* Header section */}
        <div className="flex flex-col items-center text-center pt-2 pb-6 border-b border-gray-100">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 ring-4 ring-gray-50 mb-4">
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt={displayName}
                width={80}
                height={80}
                className="object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600"
                aria-hidden="true"
              >
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          <h2 className="text-lg font-semibold text-gray-900">{displayName}</h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}

          {/* Standing indicators */}
          <div className="flex items-center gap-2 mt-3">
            {(member.standingTier === 'monthly' || member.standingTier === 'annual') ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                Member
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                Observer
              </span>
            )}
            {member.highestRole === 'admin' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
            {member.highestRole === 'moderator' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                <Shield className="w-3 h-3" />
                Moderator
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 py-5 border-b border-gray-100">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              {member.contributionPoints}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Points</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 tabular-nums">
              {member.votingPower}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Voting Power</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 tabular-nums" suppressHydrationWarning>
              {new Date(member.joinedAt).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Joined</p>
          </div>
        </div>

        {/* Details sections */}
        <div className="py-5 space-y-5">
          {/* Bio */}
          {member.bio && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">About</p>
              <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
            </div>
          )}

          {/* Info rows */}
          <div className="space-y-3">
            {jobLine && (
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">{jobLine}</span>
              </div>
            )}
            {member.industry && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">{member.industry}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">{location}</span>
              </div>
            )}
            {member.availability && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700 capitalize">{member.availability}</span>
              </div>
            )}
          </div>

          {/* Wallet */}
          {member.walletAddress && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                ETH Wallet
              </p>
              <button
                type="button"
                onClick={copyWallet}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors group/wallet"
              >
                <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm font-mono text-gray-600 truncate flex-1 text-left">
                  {member.walletAddress}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-300 group-hover/wallet:text-gray-500 shrink-0" />
                )}
              </button>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md bg-violet-50 border border-violet-100 text-xs text-violet-600 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Civic Interests */}
          {interests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Civic Interests
              </p>
              <div className="flex flex-wrap gap-1.5">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-xs text-emerald-600 font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social links */}
          {socials.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Links
              </p>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <SocialLink key={s.label} href={s.href} label={s.label} />
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
