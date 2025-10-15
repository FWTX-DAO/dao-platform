import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { usePrivy } from '@privy-io/react-auth';
import AppLayout from '@components/AppLayout';
import { useMembers } from '@hooks/useMembers';
import { User, Calendar, Award, Shield } from 'lucide-react';
import Image from 'next/image';

const MemberCard = ({ member }: { member: any }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.username || 'Member'}
              width={64}
              height={64}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
              <User className="w-8 h-8 text-white" />
            </div>
          )}
        </div>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {member.username || 'Anonymous Member'}
          </h3>

          <div className="flex items-center gap-2 mt-1">
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

            <span className="inline-flex items-center text-xs text-gray-500">
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
    </div>
  );
};

export default function MembersPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const { data: members, isLoading, error } = useMembers();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && ready && !authenticated) {
      router.push('/');
    }
  }, [mounted, ready, authenticated, router]);

  if (!mounted || !ready || !authenticated) {
    return null;
  }

  return (
    <AppLayout title="Members - Fort Worth TX DAO">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DAO Members</h1>
          <p className="text-gray-600">
            Meet the community members contributing to Fort Worth's civic innovation
          </p>
        </div>

        {/* Stats Bar */}
        {members && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Members</p>
                  <p className="text-3xl font-bold text-gray-900">{members.length}</p>
                </div>
                <User className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contributors</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter((m) => m.membershipType === 'contributor').length}
                  </p>
                </div>
                <Award className="w-10 h-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Council Members</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {members.filter((m) => m.membershipType === 'council').length}
                  </p>
                </div>
                <Shield className="w-10 h-10 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold">Error loading members</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {/* Members Grid */}
        {members && members.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {members && members.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
            <p className="text-gray-600">Be the first to join the community!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
