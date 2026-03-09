import { z } from 'zod';

export const EVENT_TYPES = [
  'meetup',
  'workshop',
  'townhall',
  'hackathon',
  'conference',
  'social',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const IssueStampsSchema = z.object({
  emails: z.array(z.string().email()).min(1),
  eventName: z.string().min(1).max(200),
  eventDate: z.string(),
  eventType: z.enum(EVENT_TYPES),
  description: z.string().max(500).optional(),
  pointsAwarded: z.number().int().min(0).max(100).default(5),
});

export type IssueStampsInput = z.infer<typeof IssueStampsSchema>;

export interface StampData {
  id: string;
  memberId: string;
  eventName: string;
  eventDate: string | null;
  eventType: string;
  description: string | null;
  issuedBy: string | null;
  pointsAwarded: number;
  metadata: unknown;
  createdAt: string;
}

export interface IssueStampsResult {
  issued: number;
  notFound: string[];
}
