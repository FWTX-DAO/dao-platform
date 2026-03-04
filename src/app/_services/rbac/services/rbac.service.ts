import { RbacRepository } from './rbac.repository';
import { NotFoundError } from '@core/errors';

export class RbacService {
  constructor(private repository: RbacRepository) {}

  async hasPermission(memberId: string, resource: string, action: string) {
    return this.repository.hasMemberPermission(memberId, resource, action);
  }

  async assignRole(memberId: string, roleName: string, grantedBy?: string) {
    const role = await this.repository.findRoleByName(roleName);
    if (!role) {
      throw new NotFoundError('Role');
    }
    return this.repository.assignRole(memberId, role.id, grantedBy);
  }

  async revokeRole(memberId: string, roleName: string) {
    const role = await this.repository.findRoleByName(roleName);
    if (!role) {
      throw new NotFoundError('Role');
    }
    await this.repository.revokeRole(memberId, role.id);
  }

  async getMemberRoles(memberId: string) {
    return this.repository.findMemberRoles(memberId);
  }

  async getMemberPermissions(memberId: string) {
    const memberRolesList = await this.repository.findMemberRoles(memberId);

    const permMap = new Map<string, { id: string; resource: string; action: string; description: string | null; createdAt: Date }>();
    for (const mr of memberRolesList) {
      const perms = await this.repository.findRolePermissions(mr.roleId);
      for (const p of perms) {
        if (!permMap.has(p.id)) {
          permMap.set(p.id, p);
        }
      }
    }

    return Array.from(permMap.values());
  }

  async getAllRoles() {
    return this.repository.findAllRoles();
  }

  async getAllPermissions() {
    return this.repository.findAllPermissions();
  }

  async getRolePermissions(roleId: string) {
    return this.repository.findRolePermissions(roleId);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.repository.findRoleById(roleId);
    if (!role) {
      throw new NotFoundError('Role');
    }
    return this.repository.setRolePermissions(roleId, permissionIds);
  }
}

export const rbacService = new RbacService(new RbacRepository());
