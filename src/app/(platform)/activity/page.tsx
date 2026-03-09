import type { Metadata } from 'next';
import { ActivityPageClient } from './_components/activity-client';

export const metadata: Metadata = {
  title: 'Activity - Fort Worth TX DAO',
};

export default function ActivityPage() {
  return <ActivityPageClient />;
}
