import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import AppLayout from '@components/AppLayout';
import ActivityFeed from '@components/ActivityFeed';

export default function ActivityPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Activity Feed - Fort Worth TX DAO">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
          <p className="text-gray-600 mt-1">See what&apos;s happening across the DAO</p>
        </div>

        <ActivityFeed variant="platform" limit={50} showHeader={false} />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Recent Activity</h2>
          <ActivityFeed variant="personal" limit={20} />
        </div>
      </div>
    </AppLayout>
  );
}
