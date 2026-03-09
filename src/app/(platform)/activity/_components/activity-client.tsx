'use client';

import ActivityFeed from '@components/ActivityFeed';
import { PageHeader } from '@components/ui/page-header';

export function ActivityPageClient() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Feed"
        subtitle="See what's happening across the DAO"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section aria-label="Platform activity">
          <h2 className="font-display text-lg text-gray-900 mb-4">Platform Activity</h2>
          <ActivityFeed variant="platform" limit={20} />
        </section>
        <section aria-label="Your activity">
          <h2 className="font-display text-lg text-gray-900 mb-4">Your Activity</h2>
          <ActivityFeed variant="personal" limit={20} />
        </section>
      </div>
    </div>
  );
}
