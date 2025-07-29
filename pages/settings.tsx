import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, getAccessToken } from "@privy-io/react-auth";
import AppLayout from "../components/AppLayout";
import { UserCircleIcon } from "@heroicons/react/24/solid";

export default function SettingsPage() {
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    unlinkWallet,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
  } = usePrivy();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated) {
      fetchProfile();
    }
  }, [authenticated]);

  const fetchProfile = async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || "");
        setBio(data.bio || "");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const numAccounts = user?.linkedAccounts?.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const email = user?.email;
  const phone = user?.phone;
  const wallet = user?.wallet;
  const googleSubject = user?.google?.subject || null;
  const twitterSubject = user?.twitter?.subject || null;
  const discordSubject = user?.discord?.subject || null;

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setError("");
    
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username,
          bio,
          avatar_url: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setUsername(data.username || "");
      setBio(data.bio || "");
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error("Error updating profile:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Settings - Fort Worth TX DAO">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account and profile</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading profile...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <UserCircleIcon className="h-20 w-20 text-gray-400" />
                <button className="text-sm text-violet-600 hover:text-violet-700">
                  Change Avatar
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
                  placeholder="Tell us about yourself"
                />
              </div>

              <button
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="bg-violet-600 hover:bg-violet-700 py-2 px-4 text-white rounded-md disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update Profile"}
              </button>
            </div>
          )}
        </div>

        {/* Linked Accounts Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Linked Accounts</h2>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Email</p>
                {email && <p className="text-sm text-gray-500">{email.address}</p>}
              </div>
              {email ? (
                <button
                  onClick={() => unlinkEmail(email.address)}
                  disabled={!canRemoveAccount}
                  className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={linkEmail}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Wallet */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Wallet</p>
                {wallet && <p className="text-sm text-gray-500">{wallet.address}</p>}
              </div>
              {wallet ? (
                <button
                  onClick={() => unlinkWallet(wallet.address)}
                  disabled={!canRemoveAccount}
                  className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={linkWallet}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Phone</p>
                {phone && <p className="text-sm text-gray-500">{phone.number}</p>}
              </div>
              {phone ? (
                <button
                  onClick={() => unlinkPhone(phone.number)}
                  disabled={!canRemoveAccount}
                  className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={linkPhone}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Google */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Google</p>
                {googleSubject && <p className="text-sm text-gray-500">Connected</p>}
              </div>
              {googleSubject ? (
                <button
                  onClick={() => unlinkGoogle(googleSubject)}
                  disabled={!canRemoveAccount}
                  className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={linkGoogle}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Twitter */}
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Twitter</p>
                {twitterSubject && <p className="text-sm text-gray-500">Connected</p>}
              </div>
              {twitterSubject ? (
                <button
                  onClick={() => unlinkTwitter(twitterSubject)}
                  disabled={!canRemoveAccount}
                  className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={linkTwitter}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Discord */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Discord</p>
                {discordSubject && <p className="text-sm text-gray-500">Connected</p>}
              </div>
              {discordSubject ? (
                <button
                  onClick={() => unlinkDiscord(discordSubject)}
                  disabled={!canRemoveAccount}
                  className="text-sm text-red-600 hover:text-red-700 disabled:text-gray-400"
                >
                  Unlink
                </button>
              ) : (
                <button
                  onClick={linkDiscord}
                  className="text-sm text-violet-600 hover:text-violet-700"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow rounded-lg p-6 border-red-200 border">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <p className="text-gray-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 py-2 px-4 text-white rounded-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </AppLayout>
  );
}