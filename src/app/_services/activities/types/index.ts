import { z } from "zod";
import { ACTIVITY_TYPES } from "@shared/constants";

export const TrackActivitySchema = z.object({
  activityType: z.enum(ACTIVITY_TYPES as unknown as [string, ...string[]]),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type TrackActivityInput = z.infer<typeof TrackActivitySchema>;

export interface ActivityFilters {
  activityType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
