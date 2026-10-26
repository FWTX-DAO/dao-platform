import { useQuery } from "@tanstack/react-query";
import { getReferralSummary } from "@/app/_actions/referrals";
import { useAuthReady } from "./useAuthReady";

export function useReferrals() {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: ["referrals", "summary"],
    queryFn: getReferralSummary,
    enabled: authReady,
    staleTime: 60_000,
  });
}
