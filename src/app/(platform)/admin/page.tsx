'use client';

import { useRoles } from '@hooks/useAdmin';

export default function AdminPage() {
  const { data: roles = [], isLoading } = useRoles();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
      <p className="text-gray-600">Manage roles, permissions, and members</p>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles</h2>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading roles...</div>
        ) : (
          <div className="space-y-2">
            {roles.map((role: any) => (
              <div key={role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{role.name}</p>
                  {role.description && <p className="text-sm text-gray-500">{role.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
