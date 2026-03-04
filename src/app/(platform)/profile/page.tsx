'use client';

import { useProfile } from '@hooks/useProfile';
import ActivityFeed from '@components/ActivityFeed';

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <div className="py-8 text-center text-gray-500">Loading profile\u2026</div>;
  if (!profile) return <div className="py-8 text-center text-gray-500">Profile not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-violet-600">{profile.username?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile.username}</h2>
            <p className="text-sm text-gray-600">{profile.email || 'No email set'}</p>
            {profile.roleNames?.length > 0 && (
              <div className="flex gap-1 mt-1">
                {profile.roleNames.map((role: string) => (
                  <span key={role} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{role}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        {profile.bio && <p className="text-gray-700">{profile.bio}</p>}
      </div>

      <ActivityFeed variant="personal" limit={10} showHeader />
    </div>
  );
}
