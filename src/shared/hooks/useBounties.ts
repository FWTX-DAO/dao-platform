import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import {
  getBounties as getBountiesAction,
  getBountyById as getBountyByIdAction,
  createBounty as createBountyAction,
  updateBounty as updateBountyAction,
  deleteBounty as deleteBountyAction,
} from "@/app/_actions/bounties";
import { queryKeys, optimisticHelpers, invalidationPatterns } from "../utils/query-client";

export interface Bounty {
  id: string;
  title: string;
  organizationName: string;
  organizationType: string;
  organizationWebsite?: string;
  problemStatement: string;
  useCase: string;
  currentState?: string;
  desiredOutcome: string;
  bountyAmount?: number;
  bountyType?: string;
  deadline?: string;
  category?: string;
  tags?: string;
  status: string;
  viewCount: number;
  proposalCount: number;
  isAnonymous: number;
  submitterId?: string;
  submitterName?: string;
  submitterAvatar?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface BountyDetails extends Bounty {
  organizationContact?: string;
  organizationIndustry?: string;
  organizationCity?: string;
  organizationState?: string;
  sponsorFirstName?: string;
  sponsorLastName?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  sponsorTitle?: string;
  commonToolsUsed?: string;
  technicalRequirements?: string;
  constraints?: string;
  deliverables?: string;
  screeningNotes?: string;
  screenedBy?: string;
  screenedAt?: string;
  updatedAt?: string;
  comments: BountyComment[];
  userHasProposal: boolean;
  userIsSubmitter: boolean;
}

export interface BountyComment {
  id: string;
  content: string;
  isInternal: number;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  parentId?: string;
  createdAt: string;
}

export interface BountyInput {
  organizationName: string;
  organizationType: string;
  organizationIndustry?: string;
  organizationCity?: string;
  organizationState?: string;
  organizationContact?: string;
  organizationWebsite?: string;
  sponsorFirstName?: string;
  sponsorLastName?: string;
  sponsorEmail?: string;
  sponsorPhone?: string;
  sponsorTitle?: string;
  title: string;
  problemStatement: string;
  useCase: string;
  currentState?: string;
  commonToolsUsed?: string | string[];
  desiredOutcome: string;
  technicalRequirements?: string | string[];
  constraints?: string;
  deliverables?: string;
  bountyAmount?: number;
  bountyType?: string;
  deadline?: string;
  category?: string;
  tags?: string | string[];
  isAnonymous?: boolean;
  submitForReview?: boolean;
}

// Optimized Query Hooks
export const useBounties = (filters?: {
  status?: string;
  category?: string;
  organizationType?: string;
  search?: string;
  includeAll?: boolean;
}) => {
  return useQuery({
    queryKey: queryKeys.bounties.list(filters),
    queryFn: () => getBountiesAction(filters) as Promise<Bounty[]>,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: filters?.status === "published" ? 60 * 1000 : false,
  });
};

// Infinite scrolling for large lists
export const useBountiesInfinite = (filters?: {
  status?: string;
  category?: string;
  organizationType?: string;
  search?: string;
  limit?: number;
}) => {
  return useInfiniteQuery({
    queryKey: [...queryKeys.bounties.list(filters), "infinite"],
    queryFn: ({ pageParam = 0 }) =>
      getBountiesAction({ ...filters }) as Promise<Bounty[]>,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * (filters?.limit || 20);
      return lastPage.length === (filters?.limit || 20) ? totalFetched : undefined;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    initialPageParam: 0,
  });
};

export const useBountyDetails = (bountyId: string | null, options?: { includeAll?: boolean }) => {
  return useQuery({
    queryKey: [...queryKeys.bounties.detail(bountyId!), options?.includeAll ? 'all' : 'public'],
    queryFn: () => getBountyByIdAction(bountyId!) as Promise<BountyDetails>,
    enabled: !!bountyId,
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Optimized Mutation Hooks with optimistic updates
export const useCreateBounty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bountyData: BountyInput) => createBountyAction(bountyData as Record<string, any>),
    onMutate: async (newBounty) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bounties.lists() });
      const previousBounties = queryClient.getQueryData(queryKeys.bounties.lists());

      const optimisticBounty: Bounty = {
        id: `temp-${Date.now()}`,
        title: newBounty.title,
        organizationName: newBounty.organizationName,
        organizationType: newBounty.organizationType,
        problemStatement: newBounty.problemStatement,
        useCase: newBounty.useCase,
        desiredOutcome: newBounty.desiredOutcome,
        status: "screening",
        viewCount: 0,
        proposalCount: 0,
        isAnonymous: newBounty.isAnonymous ? 1 : 0,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        queryKeys.bounties.lists(),
        (old: Bounty[] | undefined) => optimisticHelpers.addToList(old, optimisticBounty)
      );

      return { previousBounties };
    },
    onError: (_err, _newBounty, context) => {
      if (context?.previousBounties) {
        queryClient.setQueryData(queryKeys.bounties.lists(), context.previousBounties);
      }
    },
    onSettled: () => {
      invalidationPatterns.smartInvalidate(queryClient, "bounties", "create");
    },
  });
};

export const useUpdateBounty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: BountyInput & { id: string }) =>
      updateBountyAction(id, updates as Record<string, any>),
    onMutate: async (updatedBounty) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.bounties.detail(updatedBounty.id)
      });

      const previousBounty = queryClient.getQueryData(
        queryKeys.bounties.detail(updatedBounty.id)
      );
      const previousBounties = queryClient.getQueryData(queryKeys.bounties.lists());

      queryClient.setQueryData(
        queryKeys.bounties.detail(updatedBounty.id),
        (old: BountyDetails | undefined) => ({ ...old, ...updatedBounty })
      );

      queryClient.setQueryData(
        queryKeys.bounties.lists(),
        (old: Bounty[] | undefined) =>
          optimisticHelpers.updateInList(old, updatedBounty as any)
      );

      return { previousBounty, previousBounties };
    },
    onError: (_err, updatedBounty, context) => {
      if (context?.previousBounty) {
        queryClient.setQueryData(
          queryKeys.bounties.detail(updatedBounty.id),
          context.previousBounty
        );
      }
      if (context?.previousBounties) {
        queryClient.setQueryData(queryKeys.bounties.lists(), context.previousBounties);
      }
    },
    onSettled: (_data, _error, variables) => {
      invalidationPatterns.smartInvalidate(queryClient, "bounties", "update", variables.id);
    },
  });
};

export const useDeleteBounty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bountyId: string) => deleteBountyAction(bountyId),
    onMutate: async (bountyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bounties.lists() });
      const previousBounties = queryClient.getQueryData(queryKeys.bounties.lists());

      queryClient.setQueryData(
        queryKeys.bounties.lists(),
        (old: Bounty[] | undefined) =>
          optimisticHelpers.removeFromList(old, bountyId)
      );

      queryClient.removeQueries({
        queryKey: queryKeys.bounties.detail(bountyId)
      });

      return { previousBounties };
    },
    onError: (_err, _bountyId, context) => {
      if (context?.previousBounties) {
        queryClient.setQueryData(queryKeys.bounties.lists(), context.previousBounties);
      }
    },
    onSettled: (_data, _error, bountyId) => {
      invalidationPatterns.smartInvalidate(queryClient, "bounties", "delete", bountyId);
    },
  });
};

// Prefetch hook for better UX
export const usePrefetchBounty = () => {
  const queryClient = useQueryClient();

  return (bountyId: string, includeAll?: boolean) => {
    queryClient.prefetchQuery({
      queryKey: [...queryKeys.bounties.detail(bountyId), includeAll ? 'all' : 'public'],
      queryFn: () => getBountyByIdAction(bountyId) as Promise<BountyDetails>,
      staleTime: 10 * 1000,
    });
  };
};

// Utility functions (unchanged)
export const formatBountyAmount = (amountInCents?: number | null): string => {
  if (!amountInCents) return "Open";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
};

export const getBountyStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-800",
    assigned: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

export const getOrgTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    civic: "Civic Organization",
    commercial: "Commercial",
    "non-profit": "Non-Profit",
    government: "Government",
    educational: "Educational",
  };
  return labels[type] || type;
};
