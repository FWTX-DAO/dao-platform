import type { Metadata } from "next";
import { HydrationBoundary } from "@tanstack/react-query";
import { createPrefetchClient, dehydrate } from "@utils/prefetch";
import { queryKeys } from "@shared/constants/query-keys";
import { getProjects } from "@/app/_actions/projects";
import { ProjectsClient } from "./_components/projects-client";

export const metadata: Metadata = {
  title: "Innovation Lab - Fort Worth TX DAO",
};

export default async function InnovationLabPage() {
  const queryClient = createPrefetchClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: () => getProjects(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsClient />
    </HydrationBoundary>
  );
}
