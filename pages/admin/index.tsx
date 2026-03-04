import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile } from '@shared/hooks/useProfile';
import {
  useRoles,
  useRolePermissions,
  useUpdateRolePermissions,
  useMemberRoles,
  useAssignRole,
  useRevokeRole,
} from '@shared/hooks/useAdmin';
import { useMemberDirectory } from '@shared/hooks/useMemberDirectory';
import AppLayout from '@components/AppLayout';
import {
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

type Tab = 'analytics' | 'roles' | 'members';

export default function AdminPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>('roles');

  const isAdmin = profile?.roleNames?.includes('admin');

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!profileLoading && profile && !isAdmin) {
      router.push('/dashboard');
    }
  }, [profileLoading, profile, isAdmin, router]);

  if (!ready || !authenticated || profileLoading || !isAdmin) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'roles', label: 'Roles & Permissions' },
    { id: 'members', label: 'Member Management' },
  ];

  return (
    <AppLayout title="Admin - Fort Worth TX DAO">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage roles, permissions, and members</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'members' && <MembersTab />}
      </div>
    </AppLayout>
  );
}

function RolesTab() {
  const { data: roles, isLoading } = useRoles();
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {roles?.map((role) => (
        <div key={role.id} className="bg-white shadow-sm border border-gray-100 rounded-lg">
          <button
            onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">{role.displayName}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Level {role.level}</span>
              {role.isSystem === 1 && (
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">System</span>
              )}
            </div>
            {expandedRoleId === role.id ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {expandedRoleId === role.id && (
            <RolePermissionsPanel roleId={role.id} />
          )}
        </div>
      ))}
    </div>
  );
}

function RolePermissionsPanel({ roleId }: { roleId: string }) {
  const { data: permissions, isLoading } = useRolePermissions(roleId);
  const updatePermissions = useUpdateRolePermissions();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (permissions && !initialized) {
      setSelectedIds(new Set(permissions.map((p) => p.id)));
      setInitialized(true);
    }
  }, [permissions, initialized]);

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading permissions...</div>;
  }

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    await updatePermissions.mutateAsync({
      roleId,
      permissionIds: Array.from(selectedIds),
    });
    setInitialized(false); // Re-sync from server
  };

  // Group by resource
  const grouped: Record<string, typeof permissions> = {};
  permissions?.forEach((p) => {
    if (!grouped[p.resource]) grouped[p.resource] = [];
    grouped[p.resource]!.push(p);
  });

  return (
    <div className="px-4 pb-4 border-t border-gray-100">
      <div className="mt-3 space-y-3">
        {Object.entries(grouped).map(([resource, perms]) => (
          <div key={resource}>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{resource}</p>
            <div className="flex flex-wrap gap-2">
              {perms?.map((p) => (
                <label
                  key={p.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs cursor-pointer transition ${
                    selectedIds.has(p.id)
                      ? 'bg-violet-100 text-violet-700 border border-violet-300'
                      : 'bg-gray-50 text-gray-500 border border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="sr-only"
                  />
                  {p.action}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={updatePermissions.isPending}
          className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:bg-gray-400 text-sm font-medium transition"
        >
          {updatePermissions.isPending ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
}

function MembersTab() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: members, isLoading } = useMemberDirectory({
    search: debouncedSearch || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-sm"
        />
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
        </div>
      ) : !members || members.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No members found</div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => {
            const displayName = [member.firstName, member.lastName].filter(Boolean).join(' ') || member.username || 'Member';
            return (
              <div key={member.id} className="bg-white shadow-sm border border-gray-100 rounded-lg">
                <button
                  onClick={() => setExpandedMemberId(expandedMemberId === member.id ? null : member.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div>
                    <span className="font-medium text-gray-900">{displayName}</span>
                    {member.username && (
                      <span className="text-sm text-gray-500 ml-2">@{member.username}</span>
                    )}
                  </div>
                  {expandedMemberId === member.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {expandedMemberId === member.id && (
                  <MemberRolesPanel memberId={member.id} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MemberRolesPanel({ memberId }: { memberId: string }) {
  const { data: memberRoles, isLoading } = useMemberRoles(memberId);
  const { data: allRoles } = useRoles();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const [assigning, setAssigning] = useState('');
  const [error, setError] = useState('');

  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500">Loading roles...</div>;
  }

  const activeRoleNames = new Set(
    memberRoles?.filter((r) => r.isActive === 1).map((r) => r.roleName) || []
  );

  const handleAssign = async (roleName: string) => {
    setError('');
    setAssigning(roleName);
    try {
      await assignRole.mutateAsync({ memberId, roleName });
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    }
    setAssigning('');
  };

  const handleRevoke = async (roleName: string) => {
    setError('');
    try {
      await revokeRole.mutateAsync({ memberId, roleName });
    } catch (err: any) {
      setError(err.message || 'Failed to revoke role');
    }
  };

  return (
    <div className="px-4 pb-4 border-t border-gray-100">
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">{error}</div>
      )}

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Current Roles</p>
        {memberRoles && memberRoles.filter((r) => r.isActive === 1).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {memberRoles
              .filter((r) => r.isActive === 1)
              .map((r) => (
                <span key={r.roleId} className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 px-2.5 py-1 rounded text-xs">
                  {r.roleDisplayName}
                  <button
                    onClick={() => handleRevoke(r.roleName)}
                    className="ml-1 text-violet-500 hover:text-red-500 transition"
                    title="Revoke"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No roles assigned</p>
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Assign Role</p>
        <div className="flex flex-wrap gap-2">
          {allRoles
            ?.filter((r) => !activeRoleNames.has(r.name))
            .map((role) => (
              <button
                key={role.id}
                onClick={() => handleAssign(role.name)}
                disabled={assigning === role.name}
                className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-violet-50 hover:border-violet-300 transition disabled:opacity-50"
              >
                {assigning === role.name ? '...' : `+ ${role.displayName}`}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
