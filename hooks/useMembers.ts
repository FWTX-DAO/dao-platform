import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";

export interface Member {
  id: string;
  userId: string;
  username: string;
  membershipType: string;
  status: string;
  avatarUrl?: string;
  joinedAt: string;
}

const fetchMembers = async (): Promise<Member[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/members", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch members: ${response.statusText}`);
  }

  return response.json();
};

// Query Hooks
export const useMembers = () => {
  return useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};