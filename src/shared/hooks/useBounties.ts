import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getBounties as getBountiesAction,
  getBountyById as getBountyByIdAction,
  getMyBounties as getMyBountiesAction,
  getScreeningBounties as getScreeningBountiesAction,
  getBountyComments as getBountyCommentsAction,
  createBounty as createBountyAction,
  updateBounty as updateBountyAction,
  deleteBounty as deleteBountyAction,
  submitProposal as submitProposalAction,
  reviewProposal as reviewProposalAction,
  addBountyComment as addBountyCommentAction,
  deleteBountyComment as deleteBountyCommentAction,
  screenBounty as screenBountyAction,
  updateBountyStatus as updateBountyStatusAction,
} from "@/app/_actions/bounties";
import {
  queryKeys,
  optimisticHelpers,
  invalidationPatterns,
} from "../utils/query-client";
import { useAuthReady } from "./useAuthReady";

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
  isAnonymous: boolean;
  submitterId?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface BountyProposal {
  id: string;
  bountyId: string;
  projectId?: string;
  proposerId: string;
  proposerName?: string;
  proposalTitle: string;
  proposalDescription: string;
  approach: string;
  timeline?: string;
  budget?: string;
  teamMembers?: any;
  status: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface BountyComment {
  id: string;
  bountyId: string;
  content: string;
  isInternal: boolean;
  authorId: string;
  authorName?: string;
  parentId?: string;
  createdAt: string;
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
  technicalRequirements?: any;
  constraints?: string;
  deliverables?: string;
  screeningNotes?: string;
  screenedBy?: string;
  screenedAt?: string;
  updatedAt?: string;
  comments: BountyComment[];
  proposals: BountyProposal[];
  userHasProposal: boolean;
  isSubmitter: boolean;
  isAdmin: boolean;
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
}

export interface ProposalInput {
  proposalTitle: string;
  proposalDescription: string;
  approach: string;
  timeline?: string;
  budget?: string;
  teamMembers?: any;
  projectId?: string;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export const useBounties = (filters?: {
  status?: string;
  category?: string;
  organizationType?: string;
  search?: string;
  includeAll?: boolean;
}) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.bounties.list(filters),
    queryFn: () => getBountiesAction(filters) as unknown as Promise<Bounty[]>,
    enabled: authReady,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useBountiesInfinite = (filters?: {
  status?: string;
  category?: string;
  organizationType?: string;
  search?: string;
  limit?: number;
}) => {
  const authReady = useAuthReady();
  return useInfiniteQuery({
    queryKey: [...queryKeys.bounties.list(filters), "infinite"],
    queryFn: () =>
      getBountiesAction({ ...filters }) as unknown as Promise<Bounty[]>,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * (filters?.limit || 20);
      return lastPage.length === (filters?.limit || 20)
        ? totalFetched
        : undefined;
    },
    enabled: authReady,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    initialPageParam: 0,
  });
};

export const useBountyDetails = (bountyId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.bounties.detail(bountyId!),
    queryFn: () =>
      getBountyByIdAction(bountyId!) as unknown as Promise<BountyDetails>,
    enabled: authReady && !!bountyId,
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useMyBounties = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: [...queryKeys.bounties.all, "my"],
    queryFn: () => getMyBountiesAction() as unknown as Promise<Bounty[]>,
    enabled: authReady,
    staleTime: 30 * 1000,
  });
};

export const useScreeningBounties = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.bounties.screening(),
    queryFn: () => getScreeningBountiesAction() as unknown as Promise<any[]>,
    enabled: authReady,
    staleTime: 15 * 1000,
  });
};

export const useBountyComments = (bountyId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: [...queryKeys.bounties.detail(bountyId!), "comments"],
    queryFn: () =>
      getBountyCommentsAction(bountyId!) as unknown as Promise<BountyComment[]>,
    enabled: authReady && !!bountyId,
    staleTime: 15 * 1000,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export const useCreateBounty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bountyData: BountyInput) =>
      createBountyAction(bountyData as Record<string, any>),
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
    onSettled: (_data, _error, variables) => {
      invalidationPatterns.smartInvalidate(
        queryClient,
        "bounties",
        "update",
        variables.id,
      );
    },
  });
};

export const useDeleteBounty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bountyId: string) => deleteBountyAction(bountyId),
    onMutate: async (bountyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bounties.lists() });
      const previousBounties = queryClient.getQueryData(
        queryKeys.bounties.lists(),
      );

      queryClient.setQueryData(
        queryKeys.bounties.lists(),
        (old: Bounty[] | undefined) =>
          optimisticHelpers.removeFromList(old, bountyId),
      );

      queryClient.removeQueries({
        queryKey: queryKeys.bounties.detail(bountyId),
      });

      return { previousBounties };
    },
    onError: (_err, _bountyId, context) => {
      if (context?.previousBounties) {
        queryClient.setQueryData(
          queryKeys.bounties.lists(),
          context.previousBounties,
        );
      }
    },
    onSettled: (_data, _error, bountyId) => {
      invalidationPatterns.smartInvalidate(
        queryClient,
        "bounties",
        "delete",
        bountyId,
      );
    },
  });
};

export const useSubmitProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bountyId, ...data }: ProposalInput & { bountyId: string }) =>
      submitProposalAction(bountyId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bounties.detail(variables.bountyId),
      });
    },
  });
};

export const useReviewProposal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      proposalId,
      decision,
      notes,
    }: {
      proposalId: string;
      decision: "accepted" | "rejected" | "revision_requested";
      notes?: string;
    }) => reviewProposalAction(proposalId, decision, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.all });
    },
  });
};

export const useAddBountyComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bountyId,
      content,
      parentId,
      isInternal,
    }: {
      bountyId: string;
      content: string;
      parentId?: string;
      isInternal?: boolean;
    }) => addBountyCommentAction(bountyId, content, parentId, isInternal),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bounties.detail(variables.bountyId),
      });
    },
  });
};

export const useDeleteBountyComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteBountyCommentAction(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.all });
    },
  });
};

export const useScreenBounty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      notes,
    }: {
      id: string;
      action: "approve" | "reject" | "request_changes";
      notes?: string;
    }) => screenBountyAction(id, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.all });
    },
  });
};

export const useUpdateBountyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "assigned" | "completed" | "cancelled";
    }) => updateBountyStatusAction(id, status),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.bounties.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
};

// Prefetch hook for better UX
export const usePrefetchBounty = () => {
  const queryClient = useQueryClient();

  return (bountyId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bounties.detail(bountyId),
      queryFn: () =>
        getBountyByIdAction(bountyId) as unknown as Promise<BountyDetails>,
      staleTime: 10 * 1000,
    });
  };
};

// Utility functions
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
    draft: "bg-gray-100 text-gray-800",
    screening: "bg-yellow-100 text-yellow-800",
    published: "bg-green-100 text-green-800",
    assigned: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    rejected: "bg-red-100 text-red-800",
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
