import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@privy-io/react-auth';
import { queryKeys } from '@shared/constants/query-keys';

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
  // From user join
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  // From tier join
  tierName: string | null;
  tierDisplayName: string | null;
  // From roles join
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

const fetchProfile = async (): Promise<MemberProfile> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/members/profile', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch profile: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

const updateProfile = async (data: UpdateProfileInput): Promise<MemberProfile> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/members/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Failed to update profile: ${response.statusText}`);
  const json = await response.json();
  return json.data ?? json;
};

export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.members.profile(),
    queryFn: fetchProfile,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() });
    },
  });
};
