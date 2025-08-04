import { useState, useEffect } from 'react';
import { getAccessToken } from '@privy-io/react-auth';

export function useDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/db/${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error };
}

// Specific hooks for different resources
export function useUser() {
  const { apiCall, loading, error } = useDatabase();
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);

  const fetchUser = async () => {
    try {
      const data = await apiCall('user');
      setUser(data.user);
      setMembership(data.membership);
      return data;
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      await apiCall('user', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      await fetchUser(); // Refresh user data
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, membership, loading, error, refetch: fetchUser, updateProfile };
}