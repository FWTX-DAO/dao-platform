import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { createPrefetchClient, dehydrate } from "@utils/prefetch";
import { queryKeys } from "@shared/constants/query-keys";
import { getPlatformFeed } from "@/app/_actions/activities";
import { ActivityPageClient } from "./_components/activity-client";

export const metadata: Metadata = {
  title: "Activity - Fort Worth TX DAO",
};

export default async function ActivityPage() {
  const queryClient = createPrefetchClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.activities.feed(),
    queryFn: () => getPlatformFeed(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ActivityPageClient />
    </HydrationBoundary>
  );
}
