import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@privy-io/react-auth';
import { queryKeys } from '@shared/constants/query-keys';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  level: number;
  isSystem: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: string;
}

export interface MemberRoleAssignment {
  roleId: string;
  roleName: string;
  roleDisplayName: string;
  level: number;
  grantedAt: string;
  isActive: number;
}

const fetchRoles = async (): Promise<Role[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/admin/roles', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch roles: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const fetchRolePermissions = async (roleId: string): Promise<Permission[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch permissions: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const updateRolePermissions = async ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ permissionIds }),
  });
  if (!response.ok) throw new Error(`Failed to update permissions: ${response.statusText}`);
};

const fetchMemberRoles = async (memberId: string): Promise<MemberRoleAssignment[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/members/${memberId}/roles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch member roles: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const assignRole = async ({ memberId, roleName }: { memberId: string; roleName: string }): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/members/${memberId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ roleName, memberId }),
  });
  if (!response.ok) throw new Error(`Failed to assign role: ${response.statusText}`);
};

const revokeRole = async ({ memberId, roleName }: { memberId: string; roleName: string }): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/members/${memberId}/roles`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ roleName }),
  });
  if (!response.ok) throw new Error(`Failed to revoke role: ${response.statusText}`);
};

export const useRoles = () => {
  return useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRolePermissions = (roleId: string | null) => {
  return useQuery({
    queryKey: queryKeys.roles.permissions(roleId!),
    queryFn: () => fetchRolePermissions(roleId!),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRolePermissions,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions(variables.roleId) });
    },
  });
};

export const useMemberRoles = (memberId: string | null) => {
  return useQuery({
    queryKey: queryKeys.roles.memberRoles(memberId!),
    queryFn: () => fetchMemberRoles(memberId!),
    enabled: !!memberId,
    staleTime: 60 * 1000,
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRole,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.memberRoles(variables.memberId) });
    },
  });
};

export const useRevokeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeRole,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.memberRoles(variables.memberId) });
    },
  });
};
