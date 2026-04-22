import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMemberProfile, updateMemberProfile } from "@/app/_actions/members";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export interface MemberProfile {
  id: string;
  userId: string;
  membershipType: string;
  status: string;
  contributionPoints: number;
  votingPower: number;
  profileCompleteness: number;
  onboardingStatus: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  preferredContactMethod: string | null;
  employer: string | null;
  jobTitle: string | null;
  industry: string | null;
  yearsOfExperience: number | null;
  civicInterests: string | null;
  skills: string | null;
  availability: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  stripeCustomerId: string | null;
  currentTierId: string | null;
  termsAcceptedAt: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  walletAddress: string | null;
  walletVerifiedAt: string | null;
  tierName: string | null;
  tierDisplayName: string | null;
  roleNames: string[];
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContactMethod?: string;
  employer?: string;
  jobTitle?: string;
  industry?: string;
  yearsOfExperience?: number;
  civicInterests?: string;
  skills?: string;
  availability?: string;
  city?: string;
  state?: string;
  zip?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrl?: string;
}

export const useProfile = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.members.profile(),
    queryFn: () => getMemberProfile() as unknown as Promise<MemberProfile>,
    enabled: authReady,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      updateMemberProfile(data as Record<string, unknown>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() });
    },
  });
};
