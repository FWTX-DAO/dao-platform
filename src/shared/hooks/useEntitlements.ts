import { useProfile } from './useProfile';

const PAID_TIERS = ['monthly', 'annual', 'pro'] as const;

/**
 * Entitlements configuration.
 * Defines what each tier can do across the platform.
 *
 * free/observer: Forums (read + create), browse everything else (read-only)
 * member (paid): Full participation — projects, bounties, documents, meetings
 * staff/admin: Same as member + admin capabilities (managed via RBAC roles)
 */
export interface Entitlements {
  isLoading: boolean;
  isPaid: boolean;
  tierName: string | null;
  can: {
    // Free tier actions (everyone)
    createForumPost: boolean;
    replyToForum: boolean;
    voteOnPosts: boolean;
    // Paid tier actions (members only)
    createProject: boolean;
    submitBounty: boolean;
    uploadDocument: boolean;
    createMeetingNote: boolean;
    accessDirectory: boolean;
  };
}

export function useEntitlements(): Entitlements {
  const { data: profile, isLoading } = useProfile();

  const isPaid = profile?.tierName
    ? PAID_TIERS.includes(profile.tierName as (typeof PAID_TIERS)[number])
    : false;

  // Admin-elevated or moderator/staff accounts bypass tier check
  const hasElevatedRole = profile?.roleNames?.some(
    (r) => r === 'member' || r === 'moderator' || r === 'admin'
  ) ?? false;

  // Any authenticated user (including free/observer)
  const isAuthenticated = !!profile;

  // Paid member OR admin/staff elevated
  const hasPaidAccess = isPaid || hasElevatedRole;

  return {
    isLoading,
    isPaid,
    tierName: profile?.tierName ?? null,
    can: {
      // Free tier — open to all authenticated users
      createForumPost: isAuthenticated,
      replyToForum: isAuthenticated,
      voteOnPosts: isAuthenticated,
      // Paid tier — requires membership or elevated role
      createProject: hasPaidAccess,
      submitBounty: hasPaidAccess,
      uploadDocument: hasPaidAccess,
      createMeetingNote: hasPaidAccess,
      accessDirectory: hasPaidAccess,
    },
  };
}
