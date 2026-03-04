'use client';

import ActivityFeed from '@components/ActivityFeed';

export function ActivityPageClient() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity</h2>
          <ActivityFeed variant="platform" limit={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
          <ActivityFeed variant="personal" limit={20} />
        </div>
      </div>
    </div>
  );
}
