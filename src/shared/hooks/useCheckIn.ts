"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import {
  checkInToRoundtable,
  getRoundtableCheckInStatus,
} from "@actions/check-in";
import { queryKeys } from "@shared/constants";

export const useRoundtableCheckInStatus = () => {
  const { ready, authenticated } = usePrivy();

  return useQuery({
    queryKey: queryKeys.checkIn.roundtable(authenticated ? "auth" : "guest"),
    queryFn: () => getRoundtableCheckInStatus(),
    enabled: ready,
    staleTime: 30 * 1000,
  });
};

export const useRoundtableCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => checkInToRoundtable(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkIn.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stamps.my() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activities.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
    },
  });
};
