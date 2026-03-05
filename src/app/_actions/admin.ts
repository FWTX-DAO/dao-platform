'use server';

import { requireAdmin } from '@/app/_lib/auth';
import { rbacService } from '@services/rbac';
import { revalidatePath } from 'next/cache';

export async function getRoles() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return [];
  return rbacService.getAllRoles();
}

export async function getRolePermissions(roleId: string) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return [];
  return rbacService.getRolePermissions(roleId);
}

export async function setRolePermissions(roleId: string, permissionIds: string[]) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: 'Not authorized' };
  const result = await rbacService.setRolePermissions(roleId, permissionIds);
  revalidatePath('/admin');
  return result;
}

export async function getMemberRoles(memberId: string) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return [];
  return rbacService.getMemberRoles(memberId);
}

export async function assignRole(memberId: string, roleId: string) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: 'Not authorized' };
  const result = await rbacService.assignRole(memberId, roleId);
  revalidatePath('/admin');
  return result;
}

export async function revokeRole(memberId: string, roleId: string) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return { success: false, error: 'Not authorized' };
  const result = await rbacService.revokeRole(memberId, roleId);
  revalidatePath('/admin');
  return result;
}
