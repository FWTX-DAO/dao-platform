'use client';

import { useState, useMemo } from 'react';
import { useMembers } from '@hooks/useMembers';
import { MemberCard } from '@components/MemberCard';
import { PageHeader } from '@components/ui/page-header';
import { SearchInput } from '@components/ui/search-input';
import { EmptyState } from '@components/ui/empty-state';
import { ErrorState } from '@components/ui/error-state';
import { SkeletonGrid } from '@components/ui/skeleton';
import { Users } from 'lucide-react';

export default function MembersPage() {
  const { data: members = [], isLoading, isError, refetch } = useMembers();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter((m: any) =>
      m.username?.toLowerCase().includes(q) ||
      m.membershipType?.toLowerCase().includes(q)
    );
  }, [members, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Members" subtitle="Community members of Fort Worth DAO">
        {members.length > 0 && (
          <span className="text-sm text-gray-500 tabular-nums">{members.length} members</span>
        )}
      </PageHeader>

      {members.length > 0 && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search members\u2026"
          aria-label="Search members"
        />
      )}

      {isError ? (
        <ErrorState title="Failed to load members" onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonGrid count={6} cols={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Members will appear here once they join the DAO."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No members match your search"
          action={
            <button
              onClick={() => setSearch('')}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
            >
              Clear search
            </button>
          }
        />
      ) : (
        <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((member: any) => (
            <li key={member.id}>
              <MemberCard member={member} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
