"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePrivy,
  useSignMessage,
  useCreateWallet,
} from "@privy-io/react-auth";
import {
  useProfile,
  useUpdateProfile,
  type UpdateProfileInput,
} from "@hooks/useProfile";
import {
  verifyWallet,
  disconnectWallet,
  getWalletVerifyMessage,
} from "@/app/_actions/members";
import { getPreferredEthWallet } from "@utils/wallet";
import { updateProfile } from "@/app/_actions/users";
import { queryKeys } from "@shared/constants/query-keys";
import { PageHeader } from "@components/ui/page-header";
import IndustrySelect from "@components/IndustrySelect";
import {
  User,
  Briefcase,
  MapPin,
  Globe,
  Wallet,
  Mail,
  Check,
  Shield,
  Loader2,
  AlertCircle,
  Pen,
} from "lucide-react";

// ── Shared styles ──
const inputClass =
  "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-500 transition";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
const selectClass =
  "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-500 transition";

const AVAILABILITY_OPTIONS = [
  { value: "", label: "Select availability..." },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "volunteer", label: "Volunteer" },
  { value: "occasional", label: "Occasional" },
];

// ── Section wrapper ──
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-xs">
      <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-gray-100">
        <span className="text-violet-600">{icon}</span>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Wallet Section ──
// Handles 3 scenarios:
// 1. No Privy wallet yet → user creates embedded or links external wallet
// 2. Has Privy wallet but not verified in our DB → sign to verify
// 3. Verified → show green status with disconnect option
function WalletSection() {
  const { user: privyUser, linkWallet, unlinkWallet } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signMessage } = useSignMessage();
  const queryClient = useQueryClient();
  const { data: profile, refetch: refetchProfile } = useProfile();

  const walletAddress = profile?.walletAddress ?? null;
  const walletVerifiedAt = profile?.walletVerifiedAt ?? null;

  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Find the user's ETH wallet — prefer external (MetaMask, etc.) over embedded
  const privyWallet = getPreferredEthWallet(privyUser?.linkedAccounts);

  const invalidateWalletConsumers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
    queryClient.invalidateQueries({ queryKey: queryKeys.members.all() });
  }, [queryClient]);

  const handleCreateWallet = useCallback(async () => {
    setIsCreating(true);
    setError("");
    try {
      await createWallet();
    } catch (err: any) {
      setError(err?.message || "Failed to create wallet");
    } finally {
      setIsCreating(false);
    }
  }, [createWallet]);

  const handleLinkWallet = useCallback(() => {
    setError("");
    linkWallet();
  }, [linkWallet]);

  const handleVerify = useCallback(async () => {
    const address = privyWallet?.address;
    if (!address) {
      setError("No Ethereum wallet found. Create or link one first.");
      return;
    }

    setIsVerifying(true);
    setError("");
    setSuccess("");

    try {
      const message = await getWalletVerifyMessage(address);
      // Explicitly pass `address` so Privy signs with the wallet the user is verifying,
      // not the first wallet in linkedAccounts (critical during relink).
      const { signature } = await signMessage({ message }, { address });

      const result = await verifyWallet({
        walletAddress: address,
        signature,
        message,
      });

      if (!result.success) {
        setError(result.error || "Verification failed");
      } else {
        invalidateWalletConsumers();
        await refetchProfile();
        setSuccess("Wallet verified and connected!");
      }
    } catch (err: any) {
      if (
        err?.message?.includes("rejected") ||
        err?.message?.includes("denied")
      ) {
        setError("Signature request was cancelled");
      } else {
        setError("Failed to verify wallet. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  }, [
    privyWallet?.address,
    signMessage,
    invalidateWalletConsumers,
    refetchProfile,
  ]);

  const handleDisconnect = useCallback(async () => {
    setIsDisconnecting(true);
    setError("");
    setSuccess("");
    try {
      // Unlink from Privy first so linkedAccounts stays in sync.
      // Swallow errors — Privy may have already lost the link — then always clear the DB row.
      if (walletAddress) {
        try {
          await unlinkWallet(walletAddress);
        } catch (err) {
          console.warn("[settings] Privy unlinkWallet failed:", err);
        }
      }

      const result = await disconnectWallet();
      if (!result.success) {
        setError(result.error || "Failed to disconnect wallet");
      } else {
        invalidateWalletConsumers();
        await refetchProfile();
        setSuccess("Wallet disconnected");
      }
    } catch {
      setError("Failed to disconnect wallet");
    } finally {
      setIsDisconnecting(false);
    }
  }, [walletAddress, unlinkWallet, invalidateWalletConsumers, refetchProfile]);

  const isVerified = !!walletAddress && !!walletVerifiedAt;
  const hasPrivyWallet = !!privyWallet?.address;

  // If Privy currently holds a wallet that differs from the verified one in our DB,
  // the verified wallet is unusable here — force a re-verify for the new wallet.
  const verifiedMatchesPrivy =
    isVerified &&
    !!privyWallet?.address &&
    privyWallet.address.toLowerCase() === walletAddress?.toLowerCase();
  const showVerifiedState =
    isVerified && (verifiedMatchesPrivy || !hasPrivyWallet);

  return (
    <Section title="ETH Wallet" icon={<Wallet className="w-5 h-5" />}>
      <div className="space-y-4">
        {/* State 1: Verified wallet matches the currently-linked Privy wallet */}
        {showVerifiedState ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">
                  Verified Wallet
                </p>
                <p className="text-xs font-mono text-green-600 truncate">
                  {walletAddress}
                </p>
              </div>
              <Check className="w-4 h-4 text-green-600 shrink-0" />
            </div>
            <p className="text-xs text-gray-400" suppressHydrationWarning>
              Verified{" "}
              {new Date(walletVerifiedAt!).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleLinkWallet}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors min-h-[44px]"
              >
                <Globe className="w-4 h-4" />
                Link a different wallet
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect wallet"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Connect your Ethereum wallet and sign a message to verify
              ownership. No gas fees required.
            </p>

            {/* State 2: Has Privy wallet but not verified yet (or Privy wallet diverged from verified one) */}
            {hasPrivyWallet ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      {privyWallet?.walletClientType === "privy"
                        ? "Embedded wallet"
                        : "External wallet"}{" "}
                      detected
                    </p>
                    <p className="text-sm font-mono text-gray-600 truncate">
                      {privyWallet.address}
                    </p>
                  </div>
                </div>
                {isVerified && !verifiedMatchesPrivy && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 min-w-0">
                      <p className="font-medium">Wallet changed</p>
                      <p className="truncate">
                        Previously verified:{" "}
                        <span className="font-mono">{walletAddress}</span>. Sign
                        to verify the new wallet and update your member card.
                      </p>
                    </div>
                  </div>
                )}
                {walletAddress && !walletVerifiedAt && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700">
                      Wallet synced but not verified. Sign to prove ownership.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Pen className="w-4 h-4" />
                    )}
                    {isVerifying
                      ? "Sign to verify..."
                      : isVerified
                        ? "Sign & re-verify wallet"
                        : "Sign & verify wallet"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkWallet}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <Globe className="w-4 h-4" />
                    Link different wallet
                  </button>
                  {isVerified && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {isDisconnecting
                        ? "Disconnecting..."
                        : "Disconnect current wallet"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* State 3: No Privy wallet at all → create or link */
              <div className="space-y-3">
                <p className="text-sm text-gray-400">
                  No Ethereum wallet found in your account. You can create an
                  embedded wallet or link an existing one.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCreateWallet}
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {isCreating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wallet className="w-4 h-4" />
                    )}
                    {isCreating ? "Creating..." : "Create embedded wallet"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkWallet}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors min-h-[44px]"
                  >
                    <Globe className="w-4 h-4" />
                    Link external wallet
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
      </div>
    </Section>
  );
}

// ── Main Settings Page ──
export default function SettingsPage() {
  const { user: privyUser, linkEmail } = usePrivy();
  const { data: profile, isLoading } = useProfile();
  const updateMemberProfile = useUpdateProfile();

  // Profile fields (from members table)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employer, setEmployer] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [availability, setAvailability] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [civicInterests, setCivicInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // User fields (from users table)
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [userSaving, setUserSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [userMsg, setUserMsg] = useState("");

  // Populate form when profile loads
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setEmployer(profile.employer || "");
    setJobTitle(profile.jobTitle || "");
    setIndustry(profile.industry || "");
    setAvailability(profile.availability || "");
    setCity(profile.city || "");
    setState(profile.state || "");
    setZip(profile.zip || "");
    setCivicInterests(
      typeof profile.civicInterests === "string" ? profile.civicInterests : "",
    );
    setSkills(typeof profile.skills === "string" ? profile.skills : "");
    setLinkedinUrl(profile.linkedinUrl || "");
    setTwitterUrl(profile.twitterUrl || "");
    setGithubUrl(profile.githubUrl || "");
    setWebsiteUrl(profile.websiteUrl || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
  }, [profile]);

  const handleSaveProfile = useCallback(() => {
    setProfileMsg("");
    const data: UpdateProfileInput = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      employer: employer.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      industry: industry.trim() || undefined,
      availability: availability || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zip: zip.trim() || undefined,
      civicInterests: civicInterests.trim() || undefined,
      skills: skills.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
    };
    updateMemberProfile.mutate(data, {
      onSuccess: () => setProfileMsg("Profile updated!"),
      onError: () => setProfileMsg("Failed to update profile"),
    });
  }, [
    firstName,
    lastName,
    employer,
    jobTitle,
    industry,
    availability,
    city,
    state,
    zip,
    civicInterests,
    skills,
    linkedinUrl,
    twitterUrl,
    githubUrl,
    websiteUrl,
    updateMemberProfile,
  ]);

  const handleSaveUser = useCallback(async () => {
    setUserSaving(true);
    setUserMsg("");
    try {
      await updateProfile({
        username: username.trim(),
        bio: bio.trim() || undefined,
      });
      setUserMsg("Saved!");
    } catch {
      setUserMsg("Failed to save");
    } finally {
      setUserSaving(false);
    }
  }, [username, bio]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <PageHeader
          title="Settings"
          subtitle="Manage your account and profile"
        />
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <PageHeader title="Settings" subtitle="Manage your account and profile" />

      {/* Account (username, bio) */}
      <Section title="Account" icon={<User className="w-5 h-5" />}>
        <div className="space-y-4">
          <div>
            <label htmlFor="s-username" className={labelClass}>
              Username
            </label>
            <input
              id="s-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              maxLength={30}
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="s-bio" className={labelClass}>
              Bio
            </label>
            <textarea
              id="s-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Tell the community about yourself..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveUser}
              disabled={userSaving}
              className="px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {userSaving ? "Saving..." : "Save Account"}
            </button>
            {userMsg && (
              <span className="text-sm text-green-600">{userMsg}</span>
            )}
          </div>
        </div>
      </Section>

      {/* Personal Info */}
      <Section title="Personal Info" icon={<User className="w-5 h-5" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="s-firstName" className={labelClass}>
                First Name
              </label>
              <input
                id="s-firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="s-lastName" className={labelClass}>
                Last Name
              </label>
              <input
                id="s-lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                autoComplete="family-name"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Professional */}
      <Section title="Professional" icon={<Briefcase className="w-5 h-5" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="s-employer" className={labelClass}>
                Employer
              </label>
              <input
                id="s-employer"
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                className={inputClass}
                autoComplete="organization"
              />
            </div>
            <div>
              <label htmlFor="s-jobTitle" className={labelClass}>
                Job Title
              </label>
              <input
                id="s-jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className={inputClass}
                autoComplete="organization-title"
              />
            </div>
          </div>
          <div>
            <label htmlFor="s-industry" className={labelClass}>
              Industry
            </label>
            <IndustrySelect value={industry} onChange={setIndustry} />
          </div>
          <div>
            <label htmlFor="s-availability" className={labelClass}>
              Availability
            </label>
            <select
              id="s-availability"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={selectClass}
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Location */}
      <Section title="Location" icon={<MapPin className="w-5 h-5" />}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="s-city" className={labelClass}>
              City
            </label>
            <input
              id="s-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label htmlFor="s-state" className={labelClass}>
              State
            </label>
            <input
              id="s-state"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
              maxLength={2}
              autoComplete="address-level1"
            />
          </div>
          <div>
            <label htmlFor="s-zip" className={labelClass}>
              ZIP
            </label>
            <input
              id="s-zip"
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className={inputClass}
              maxLength={10}
              autoComplete="postal-code"
            />
          </div>
        </div>
      </Section>

      {/* Civic */}
      <Section title="Community" icon={<User className="w-5 h-5" />}>
        <div className="space-y-4">
          <div>
            <label htmlFor="s-civicInterests" className={labelClass}>
              Civic Interests
            </label>
            <textarea
              id="s-civicInterests"
              value={civicInterests}
              onChange={(e) => setCivicInterests(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="e.g., urban planning, education, public safety"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>
          <div>
            <label htmlFor="s-skills" className={labelClass}>
              Skills
            </label>
            <textarea
              id="s-skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="e.g., web development, project management"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>
        </div>
      </Section>

      {/* Social Links */}
      <Section title="Social Links" icon={<Globe className="w-5 h-5" />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="s-linkedin" className={labelClass}>
                LinkedIn
              </label>
              <input
                id="s-linkedin"
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className={inputClass}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <label htmlFor="s-twitter" className={labelClass}>
                Twitter / X
              </label>
              <input
                id="s-twitter"
                type="url"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                className={inputClass}
                placeholder="https://x.com/..."
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="s-github" className={labelClass}>
                GitHub
              </label>
              <input
                id="s-github"
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className={inputClass}
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label htmlFor="s-website" className={labelClass}>
                Website
              </label>
              <input
                id="s-website"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Save profile button (all member fields) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={updateMemberProfile.isPending}
          className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium text-sm transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {updateMemberProfile.isPending ? "Saving..." : "Save Profile"}
        </button>
        {profileMsg && (
          <span className="text-sm text-green-600">{profileMsg}</span>
        )}
      </div>

      {/* Connected Accounts */}
      <Section title="Connected Accounts" icon={<Mail className="w-5 h-5" />}>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-700">Email</p>
            <p className="text-xs text-gray-500">
              {privyUser?.email?.address || "Not connected"}
            </p>
          </div>
          {!privyUser?.email && (
            <button
              type="button"
              onClick={linkEmail}
              className="text-sm text-violet-600 hover:text-violet-700 font-medium"
            >
              Link Email
            </button>
          )}
        </div>
      </Section>

      {/* Wallet */}
      <WalletSection />
    </div>
  );
}
