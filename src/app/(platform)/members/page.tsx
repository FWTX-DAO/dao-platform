'use client';

import { useMembers } from '@hooks/useMembers';
import { MemberCard } from '@components/MemberCard';

export default function MembersPage() {
  const { data: members = [], isLoading } = useMembers();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Members</h1>
      <p className="text-gray-600">Community members of Fort Worth DAO</p>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No members yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member: any) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
