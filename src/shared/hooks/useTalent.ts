import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getTalentProfiles as getTalentProfilesAction } from "@/app/_actions/talent";
import type { TalentListParams } from "@services/talent";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export const useTalentProfiles = (params: TalentListParams) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.talent.list(params),
    queryFn: () => getTalentProfilesAction(params),
    enabled: authReady,
    // Keep the current page on screen while the next page or search loads.
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
};
