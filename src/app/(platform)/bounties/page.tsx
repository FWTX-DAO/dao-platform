import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { createPrefetchClient, dehydrate } from "@utils/prefetch";
import { queryKeys } from "@shared/constants/query-keys";
import { getBounties } from "@/app/_actions/bounties";
import { BountiesClient } from "./_components/bounties-client";

export const metadata: Metadata = {
  title: "Bounties - Fort Worth TX DAO",
};

export default async function BountiesPage() {
  const queryClient = createPrefetchClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.bounties.list(undefined),
    queryFn: () => getBounties(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BountiesClient />
    </HydrationBoundary>
  );
}
