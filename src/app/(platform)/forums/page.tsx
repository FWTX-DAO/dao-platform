import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { createPrefetchClient, dehydrate } from "@utils/prefetch";
import { queryKeys } from "@shared/constants/query-keys";
import { getPosts } from "@/app/_actions/forum";
import { ForumsClient } from "./_components/forums-client";

export const metadata: Metadata = {
  title: "Forums - Fort Worth TX DAO",
};

export default async function ForumsPage() {
  const queryClient = createPrefetchClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.forum.posts(),
    queryFn: () => getPosts(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ForumsClient />
    </HydrationBoundary>
  );
}
