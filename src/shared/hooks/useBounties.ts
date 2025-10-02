import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";
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

// API Functions
const fetchBounties = async (filters?: {
  status?: string;
  category?: string;
  organizationType?: string;
  search?: string;
  includeAll?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Bounty[]> => {
  const accessToken = await getAccessToken();
  
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
  }
  
  const response = await fetch(`/api/bounties?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error: any = new Error(`Failed to fetch bounties: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

const fetchBountyDetails = async (bountyId: string): Promise<BountyDetails> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/bounties/${bountyId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error: any = new Error(`Failed to fetch bounty details: ${response.statusText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
};

const createBounty = async (bountyData: BountyInput): Promise<Bounty> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/bounties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(bountyData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create bounty: ${response.statusText}`);
  }

  return response.json();
};

const updateBounty = async ({ 
  id, 
  ...updates 
}: BountyInput & { id: string }): Promise<Bounty> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/bounties", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update bounty: ${response.statusText}`);
  }

  return response.json();
};

const deleteBounty = async (bountyId: string): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/bounties", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ id: bountyId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete bounty: ${response.statusText}`);
  }
};

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
    queryFn: () => fetchBounties(filters),
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: filters?.status === "published" ? 60 * 1000 : false, // Auto-refetch published bounties every minute
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
      fetchBounties({ ...filters, limit: filters?.limit || 20, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.length * (filters?.limit || 20);
      return lastPage.length === (filters?.limit || 20) ? totalFetched : undefined;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    initialPageParam: 0,
  });
};

export const useBountyDetails = (bountyId: string | null) => {
  return useQuery({
    queryKey: queryKeys.bounties.detail(bountyId!),
    queryFn: () => fetchBountyDetails(bountyId!),
    enabled: !!bountyId,
    staleTime: 10 * 1000, // Details are fresh for 10 seconds
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

// Optimized Mutation Hooks with optimistic updates
export const useCreateBounty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBounty,
    // Optimistic update
    onMutate: async (newBounty) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.bounties.lists() });
      
      // Snapshot previous value
      const previousBounties = queryClient.getQueryData(queryKeys.bounties.lists());
      
      // Optimistically update to the new value
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
      
      // Return context with snapshot
      return { previousBounties };
    },
    // On error, revert to previous value
    onError: (_err, _newBounty, context) => {
      if (context?.previousBounties) {
        queryClient.setQueryData(queryKeys.bounties.lists(), context.previousBounties);
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      invalidationPatterns.smartInvalidate(queryClient, "bounties", "create");
    },
  });
};

export const useUpdateBounty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateBounty,
    // Optimistic update
    onMutate: async (updatedBounty) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.bounties.detail(updatedBounty.id) 
      });
      
      // Snapshot previous values
      const previousBounty = queryClient.getQueryData(
        queryKeys.bounties.detail(updatedBounty.id)
      );
      const previousBounties = queryClient.getQueryData(queryKeys.bounties.lists());
      
      // Optimistically update bounty details
      queryClient.setQueryData(
        queryKeys.bounties.detail(updatedBounty.id),
        (old: BountyDetails | undefined) => ({
          ...old,
          ...updatedBounty,
        })
      );
      
      // Optimistically update in list
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
    mutationFn: deleteBounty,
    // Optimistic update
    onMutate: async (bountyId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.bounties.lists() });
      
      // Snapshot previous value
      const previousBounties = queryClient.getQueryData(queryKeys.bounties.lists());
      
      // Optimistically remove from list
      queryClient.setQueryData(
        queryKeys.bounties.lists(),
        (old: Bounty[] | undefined) => 
          optimisticHelpers.removeFromList(old, bountyId)
      );
      
      // Remove from cache
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
  
  return (bountyId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.bounties.detail(bountyId),
      queryFn: () => fetchBountyDetails(bountyId),
      staleTime: 10 * 1000,
    });
  };
};

// Utility function to format bounty amount
export const formatBountyAmount = (amountInCents?: number | null): string => {
  if (!amountInCents) return "Open";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
};

// Utility function to get status color
export const getBountyStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    published: "bg-green-100 text-green-800",
    assigned: "bg-blue-100 text-blue-800",
    completed: "bg-purple-100 text-purple-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return statusColors[status] || "bg-gray-100 text-gray-800";
};

// Utility function to get organization type label
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