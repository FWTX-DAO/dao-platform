import { useState, useEffect } from 'react';
import { getUserProfile } from '@/app/_actions/users';
import { getMemberProfile } from '@/app/_actions/members';

export function useDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return { loading, error };
}

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userData, memberData] = await Promise.all([
        getUserProfile(),
        getMemberProfile(),
      ]);
      setUser(userData);
      setMembership(memberData);
      return { user: userData, membership: memberData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, membership, loading, error, refetch: fetchUser, updateProfile: async () => {} };
}
