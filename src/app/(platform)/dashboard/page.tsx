import type { Metadata } from 'next';
import { DashboardClient } from './_components/dashboard-client';

export const metadata: Metadata = {
  title: 'Dashboard - Fort Worth TX DAO',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
