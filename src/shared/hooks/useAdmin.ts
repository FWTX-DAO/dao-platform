import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoles as getRolesAction,
  getRolePermissions as getRolePermissionsAction,
  setRolePermissions as setRolePermissionsAction,
  getMemberRoles as getMemberRolesAction,
  assignRole as assignRoleAction,
  revokeRole as revokeRoleAction,
} from '@/app/_actions/admin';
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

export const useRoles = () => {
  return useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: () => getRolesAction() as unknown as Promise<Role[]>,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRolePermissions = (roleId: string | null) => {
  return useQuery({
    queryKey: queryKeys.roles.permissions(roleId!),
    queryFn: () => getRolePermissionsAction(roleId!) as unknown as Promise<Permission[]>,
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      setRolePermissionsAction(roleId, permissionIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.permissions(variables.roleId) });
    },
  });
};

export const useMemberRoles = (memberId: string | null) => {
  return useQuery({
    queryKey: queryKeys.roles.memberRoles(memberId!),
    queryFn: () => getMemberRolesAction(memberId!) as unknown as Promise<MemberRoleAssignment[]>,
    enabled: !!memberId,
    staleTime: 60 * 1000,
  });
};

export const useAssignRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, roleName }: { memberId: string; roleName: string }) =>
      assignRoleAction(memberId, roleName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.memberRoles(variables.memberId) });
    },
  });
};

export const useRevokeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, roleName }: { memberId: string; roleName: string }) =>
      revokeRoleAction(memberId, roleName),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.memberRoles(variables.memberId) });
    },
  });
};
