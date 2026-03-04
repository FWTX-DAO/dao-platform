export interface PassportStamp {
  id: string;
  eventName: string;
  eventDate: string | null;
  eventType: string;
  pointsAwarded: number;
  createdAt: string;
}

export interface PassportData {
  avatarUrl: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  memberId: string;
  membershipType: string;
  joinedAt: string;
  contributionPoints: number;
  votingPower: number;
  skills: string | null;
  civicInterests: string | null;
  city: string | null;
  state: string | null;
  walletAddress: string | null;
  tierDisplayName: string | null;
  roleNames: string[];
  stamps?: PassportStamp[];
}
