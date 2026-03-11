'use server';

import { requireAdmin } from '@/app/_lib/auth';
import { rbacService } from '@services/rbac';
import { revalidatePath } from 'next/cache';

export async function getRoles() {
  await requireAdmin();
  return rbacService.getAllRoles();
}

export async function getRolePermissions(roleId: string) {
  await requireAdmin();
  return rbacService.getRolePermissions(roleId);
}

export async function setRolePermissions(roleId: string, permissionIds: string[]) {
  await requireAdmin();
  const result = await rbacService.setRolePermissions(roleId, permissionIds);
  revalidatePath('/admin');
  return result;
}

export async function getMemberRoles(memberId: string) {
  await requireAdmin();
  return rbacService.getMemberRoles(memberId);
}

export async function assignRole(memberId: string, roleId: string) {
  await requireAdmin();
  const result = await rbacService.assignRole(memberId, roleId);
  revalidatePath('/admin');
  return result;
}

export async function revokeRole(memberId: string, roleId: string) {
  await requireAdmin();
  const result = await rbacService.revokeRole(memberId, roleId);
  revalidatePath('/admin');
  return result;
}
