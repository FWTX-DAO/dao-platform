import { useQuery } from "@tanstack/react-query";
import { listMembers } from "@/app/_actions/members";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export interface Member {
  id: string;
  userId: string;
  username: string | null;
  avatarUrl: string | null;
  walletAddress: string | null;
  membershipType: string;
  contributionPoints: number;
  votingPower: number;
  status: string;
  joinedAt: string;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  employer: string | null;
  city: string | null;
  state: string | null;
  industry: string | null;
  skills: unknown;
  bio: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  civicInterests: unknown;
  availability: string | null;
  // Accurate standing from tier + roles
  tierName: string | null;
  tierDisplayName: string | null;
  standingLabel: string;
  standingTier: string;
  highestRole: string;
  roleNames: string[];
}

export const useMembers = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.members.all(),
    queryFn: () => listMembers() as unknown as Promise<Member[]>,
    enabled: authReady,
    staleTime: 1000 * 60 * 5,
  });
};
