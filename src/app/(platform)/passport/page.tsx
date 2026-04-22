"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@shared/hooks/useProfile";
import { PassportFull } from "@components/passport";
import type { PassportData, PassportStamp } from "@components/passport";
import { useMyStamps } from "@shared/hooks/usePassportStamps";
import { queryKeys } from "@shared/constants/query-keys";
import { Calendar, Award } from "lucide-react";
import ActivityFeed from "@components/ActivityFeed";
import { StatCard } from "@components/ui/stat-card";
import { ErrorState } from "@components/ui/error-state";
import { EmptyState } from "@components/ui/empty-state";
import { Skeleton } from "@components/ui/skeleton";

export default function PassportPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useProfile();
  const { data: stamps } = useMyStamps();

  const success = searchParams.get("success") === "true";

  // Invalidate + poll caches when returning from Stripe checkout
  useEffect(() => {
    if (!success) return;

    const invalidateAll = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscriptions.active(),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.members.profile() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.membership(),
      });
    };

    invalidateAll();
    const timers = [2000, 5000, 10000].map((ms) =>
      setTimeout(invalidateAll, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [success, queryClient]);

  if (isLoading) {
    return (
      <div
        className="max-w-4xl mx-auto py-4 space-y-8"
        role="status"
        aria-label="Loading passport"
      >
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <span className="sr-only">Loading&hellip;</span>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        <ErrorState
          title="Unable to load profile"
          message="We couldn't load your passport data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Only show a verified wallet on the passport. An unverified Privy-linked
  // wallet doesn't prove ownership — users must sign from Settings to be displayed here.
  const verifiedWallet = profile.walletVerifiedAt
    ? profile.walletAddress
    : null;

  const passportStamps: PassportStamp[] = (stamps || []).map((s: any) => ({
    id: s.id,
    eventName: s.eventName,
    eventDate: s.eventDate,
    eventType: s.eventType,
    pointsAwarded: s.pointsAwarded,
    createdAt: s.createdAt,
  }));

  const passportData: PassportData = {
    avatarUrl: profile.avatarUrl,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    memberId: profile.id,
    membershipType: profile.membershipType,
    joinedAt: profile.joinedAt,
    contributionPoints: profile.contributionPoints,
    votingPower: profile.votingPower,
    skills: profile.skills,
    civicInterests: profile.civicInterests,
    city: profile.city,
    state: profile.state,
    walletAddress: verifiedWallet,
    tierDisplayName: profile.tierDisplayName,
    roleNames: profile.roleNames,
    stamps: passportStamps,
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-6">
          <p className="text-sm font-medium text-green-800">
            Welcome aboard! Your membership is being activated. It may take a
            moment to reflect on your passport.
          </p>
        </div>
      )}

      <h1 className="font-display text-3xl text-gray-900 mb-2">
        Your Passport
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Your Fort Worth DAO identity document
      </p>

      <div className="flex justify-center mb-10">
        <PassportFull data={passportData} defaultOpen />
      </div>

      {/* Member stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Contribution Points"
          value={profile.contributionPoints}
        />
        <StatCard label="Voting Power" value={profile.votingPower} />
        <StatCard
          label="Profile Complete"
          value={`${profile.profileCompleteness}%`}
        />
        <StatCard label="Roles" value={profile.roleNames.length} />
      </div>

      {/* Stamps section */}
      <div className="mt-10">
        <h2 className="font-display text-xl text-gray-900 mb-4">
          Event Stamps
        </h2>
        {passportStamps.length === 0 ? (
          <EmptyState
            icon={<Award />}
            title="No stamps yet"
            description="Attend DAO events and meetings to earn stamps and contribution points."
            className="py-8 bg-white rounded-lg border border-gray-200"
          />
        ) : (
          <ul className="space-y-3">
            {passportStamps.map((stamp) => (
              <li
                key={stamp.id}
                className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4"
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-full bg-dao-gold/10 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Calendar className="w-5 h-5 text-dao-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {stamp.eventName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stamp.eventType.charAt(0).toUpperCase() +
                      stamp.eventType.slice(1)}
                    {stamp.eventDate && (
                      <time
                        dateTime={new Date(stamp.eventDate).toISOString()}
                        suppressHydrationWarning
                      >
                        {` \u00B7 ${new Date(stamp.eventDate).toLocaleDateString("en-US")}`}
                      </time>
                    )}
                  </div>
                </div>
                <div className="text-sm font-semibold text-dao-gold shrink-0">
                  +{stamp.pointsAwarded} pts
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Activity */}
      <div className="mt-10">
        <ActivityFeed variant="personal" limit={10} showHeader />
      </div>
    </div>
  );
}
