"use client";

import Link from "next/link";
import { useRoles } from "@hooks/useAdmin";
import { useScreeningBounties } from "@hooks/useBounties";

export default function AdminPage() {
  const { data: roles = [], isLoading } = useRoles();
  const { data: screeningBounties = [] } = useScreeningBounties();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
      <p className="text-gray-600">Manage roles, permissions, and members</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/bounties"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200"
        >
          <h3 className="font-semibold text-gray-900">Bounty Screening</h3>
          <p className="text-3xl font-bold text-violet-600 mt-2">
            {screeningBounties.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">pending review</p>
        </Link>
        <Link
          href="/admin/stamps"
          className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200"
        >
          <h3 className="font-semibold text-gray-900">Passport Stamps</h3>
          <p className="text-sm text-gray-500 mt-2">Issue stamps to members</p>
        </Link>
        <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h3 className="font-semibold text-gray-900">Roles</h3>
          <p className="text-3xl font-bold text-violet-600 mt-2">
            {roles.length}
          </p>
          <p className="text-sm text-gray-500 mt-1">configured</p>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Roles</h2>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">
            Loading roles{"\u2026"}
          </div>
        ) : (
          <div className="space-y-2">
            {roles.map((role: any) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900">{role.name}</p>
                  {role.description && (
                    <p className="text-sm text-gray-500">{role.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  Level {role.level}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
