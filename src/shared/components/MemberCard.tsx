import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Calendar, Award, Shield } from 'lucide-react';

interface MemberCardProps {
  member: {
    id: string;
    username?: string | null;
    avatarUrl?: string | null;
    membershipType: string;
    joinedAt: string;
    status: string;
  };
}

export const MemberCard = memo(function MemberCard({ member }: MemberCardProps) {
  return (
    <Link
      href={`/directory?member=${member.id}`}
      className="block bg-white rounded-lg shadow-xs p-6 hover:shadow-md transition-shadow border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 150px' }}
    >
      <div className="flex items-start gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 shrink-0">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.username || 'Member'}
              width={56}
              height={56}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600" aria-hidden="true">
              <User className="w-7 h-7 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate">
            {member.username || 'Anonymous Member'}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                member.membershipType === 'council'
                  ? 'bg-purple-100 text-purple-800'
                  : member.membershipType === 'contributor'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {member.membershipType === 'council' && <Shield className="w-3 h-3 mr-1" />}
              {member.membershipType === 'contributor' && <Award className="w-3 h-3 mr-1" />}
              {member.membershipType}
            </span>

            <span className="inline-flex items-center text-xs text-gray-500" suppressHydrationWarning>
              <Calendar className="w-3 h-3 mr-1" />
              Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                member.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {member.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});
