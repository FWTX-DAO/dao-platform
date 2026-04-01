import { memo } from 'react';
import Image from 'next/image';
import { User, Shield, Crown, MapPin, Briefcase, Wallet, Star } from 'lucide-react';
import type { Member } from '@hooks/useMembers';

interface MemberCardProps {
  member: Member;
  onClick?: () => void;
}

function truncateWallet(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function parseSkills(skills: unknown): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map(String);
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed.map(String) : [skills];
    } catch {
      return skills.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function isPaidMember(member: Member) {
  return member.standingTier === 'monthly' || member.standingTier === 'annual';
}

export const MemberCard = memo(function MemberCard({ member, onClick }: MemberCardProps) {
  const displayName = member.firstName && member.lastName
    ? `${member.firstName} ${member.lastName}`
    : member.username || 'Anonymous Member';
  const subtitle = member.username && member.firstName ? `@${member.username}` : null;
  const location = [member.city, member.state].filter(Boolean).join(', ');
  const jobLine = [member.jobTitle, member.employer].filter(Boolean).join(' at ');
  const skills = parseSkills(member.skills).slice(0, 3);
  const paid = isPaidMember(member);
  const isAdmin = member.highestRole === 'admin';
  const isMod = member.highestRole === 'moderator';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-5 hover:border-violet-200 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden group"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 200px' }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-100 group-hover:ring-violet-100 transition-colors">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={displayName}
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600" aria-hidden="true">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h3>
            {paid && <Star className="w-4 h-4 shrink-0 text-amber-500 fill-amber-400" aria-label="Paid member" />}
            {paid && <Crown className="w-4 h-4 shrink-0 text-amber-500" aria-label="DAO member" />}
            {isAdmin && <Shield className="w-4 h-4 shrink-0 text-red-500" aria-label="Admin" />}
            {isMod && !isAdmin && <Shield className="w-4 h-4 shrink-0 text-purple-500" aria-label="Moderator" />}
          </div>

          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
          )}
          {!paid && (
            <span className="inline-block mt-1 text-[10px] text-gray-400 tracking-wide uppercase">Observer</span>
          )}

          {/* Job + Location row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
            {jobLine && (
              <span className="inline-flex items-center truncate">
                <Briefcase className="w-3 h-3 mr-1 shrink-0 text-gray-400" />
                <span className="truncate">{jobLine}</span>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center">
                <MapPin className="w-3 h-3 mr-1 shrink-0 text-gray-400" />
                {location}
              </span>
            )}
          </div>

          {/* Bottom row: wallet, points, skills */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {member.walletAddress && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[11px] text-gray-500 font-mono">
                <Wallet className="w-3 h-3 text-gray-400" />
                {truncateWallet(member.walletAddress)}
              </span>
            )}

            {member.contributionPoints > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-medium">
                <Star className="w-3 h-3" />
                {member.contributionPoints} pts
              </span>
            )}

            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-100 text-[11px] text-violet-600 font-medium truncate max-w-[100px]"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
});
