export interface ReferralSummary {
  code: string;
  invitedMembers: number;
  paidMembers: number;
  earnedPoints: number;
  recentRewards: Array<{
    id: string;
    kind: string;
    points: number;
    createdAt: Date;
  }>;
}
