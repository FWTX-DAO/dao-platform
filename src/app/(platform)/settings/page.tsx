'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useProfile, useUpdateProfile } from '@hooks/useProfile';
import { useState, useEffect } from 'react';
import WalletList from '@components/WalletList';

export default function SettingsPage() {
  const { user, linkEmail } = usePrivy();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({ username, bio } as any);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="settings-username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              id="settings-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              name="username"
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <div>
            <label htmlFor="settings-bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="settings-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              name="bio"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            {updateProfile.isPending ? 'Saving\u2026' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-xs text-gray-500">{user?.email?.address || 'Not connected'}</p>
            </div>
            {!user?.email && (
              <button onClick={linkEmail} className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                Link Email
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallets</h2>
        <WalletList />
      </div>
    </div>
  );
}
