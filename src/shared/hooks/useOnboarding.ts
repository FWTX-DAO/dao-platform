import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@privy-io/react-auth';
import { queryKeys } from '@shared/constants/query-keys';

export interface CompleteOnboardingInput {
  firstName: string;
  lastName: string;
  email: string;
  termsAccepted: true;
  phone?: string;
  employer?: string;
  jobTitle?: string;
  industry?: string;
  civicInterests?: string;
  skills?: string;
  availability?: string;
  city?: string;
  state?: string;
  zip?: string;
}

const completeOnboarding = async (data: CompleteOnboardingInput): Promise<unknown> => {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/members/onboard', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Onboarding failed: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data ?? json;
};

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() });
    },
  });
};
