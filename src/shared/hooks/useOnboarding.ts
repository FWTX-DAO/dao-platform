import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding as completeOnboardingAction } from "@/app/_actions/members";
import { queryKeys } from "@shared/constants/query-keys";

export interface CompleteOnboardingInput {
  username: string;
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
  walletAddress?: string;
}

export const useCompleteOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CompleteOnboardingInput) =>
      completeOnboardingAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.stats() });
    },
  });
};
