"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@shared/constants";
import { useAuthReady } from "./useAuthReady";
import { getMyStamps, getMemberStamps, issueStamps } from "@actions/stamps";
import type { IssueStampsInput } from "@services/stamps/types";

export const useMyStamps = () => {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: queryKeys.stamps.my(),
    queryFn: () => getMyStamps(),
    enabled: authReady,
    staleTime: 60 * 1000,
  });
};

export const useMemberStamps = (memberId: string | null) => {
  const authReady = useAuthReady();

  return useQuery({
    queryKey: queryKeys.stamps.member(memberId!),
    queryFn: () => getMemberStamps(memberId!),
    enabled: authReady && !!memberId,
    staleTime: 60 * 1000,
  });
};

export const useIssueStamps = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IssueStampsInput) => issueStamps(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stamps.all() });
    },
  });
};
