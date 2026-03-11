import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { createPrefetchClient, dehydrate } from "@utils/prefetch";
import { queryKeys } from "@shared/constants/query-keys";
import { getDashboardStats } from "@/app/_actions/dashboard";
import { getMemberStats } from "@/app/_actions/members";
import { DashboardClient } from "./_components/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard - Fort Worth TX DAO",
};

export default async function DashboardPage() {
  const queryClient = createPrefetchClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: () => getDashboardStats(),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard.membership(),
      queryFn: () => getMemberStats(),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  );
}
