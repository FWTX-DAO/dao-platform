'use client';

import { useProfile } from '@shared/hooks/useProfile';
import { usePrivy } from '@privy-io/react-auth';
import { PassportFull } from '@components/passport';
import type { PassportData, PassportStamp } from '@components/passport';
import { useMyStamps } from '@shared/hooks/usePassportStamps';
import { Calendar } from 'lucide-react';

export default function PassportPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: stamps } = useMyStamps();
  const { user } = usePrivy();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-dao-gold/30 border-t-dao-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-gray-500">
        Unable to load profile data.
      </div>
    );
  }

  const walletAccount = user?.linkedAccounts?.find(
    (a: any) => a.type === 'wallet'
  ) as any;

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
    walletAddress: walletAccount?.address || null,
    tierDisplayName: profile.tierDisplayName,
    roleNames: profile.roleNames,
    stamps: passportStamps,
  };

  return (
    <div className="max-w-3xl mx-auto py-4">
      <h1 className="font-display text-3xl text-gray-900 mb-2">Your Passport</h1>
      <p className="text-gray-500 text-sm mb-8">
        Your Fort Worth DAO identity document
      </p>

      <div className="flex justify-center mb-10">
        <PassportFull data={passportData} defaultOpen />
      </div>

      {/* Member stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Contribution Points" value={profile.contributionPoints} />
        <StatCard label="Voting Power" value={profile.votingPower} />
        <StatCard label="Profile Complete" value={`${profile.profileCompleteness}%`} />
        <StatCard label="Roles" value={profile.roleNames.length} />
      </div>

      {/* Stamps section */}
      {passportStamps.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-gray-900 mb-4">Event Stamps</h2>
          <div className="space-y-3">
            {passportStamps.map((stamp) => (
              <div
                key={stamp.id}
                className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-dao-gold/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-dao-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{stamp.eventName}</div>
                  <div className="text-xs text-gray-500">
                    {stamp.eventType.charAt(0).toUpperCase() + stamp.eventType.slice(1)}
                    {stamp.eventDate && ` \u00B7 ${new Date(stamp.eventDate).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="text-sm font-semibold text-dao-gold">
                  +{stamp.pointsAwarded} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
