import { z } from 'zod';
import { VALIDATION_LIMITS } from '@shared/constants';
import type { MeetingNote as MeetingNoteDB, InsertMeetingNote } from '@shared/types';

export type MeetingNote = MeetingNoteDB;
export type CreateMeetingNote = InsertMeetingNote;

export const CreateMeetingNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(VALIDATION_LIMITS.TITLE_MAX_LENGTH),
  date: z.string().min(1, 'Date is required'),
  attendees: z.string().optional(),
  agenda: z.string().optional(),
  notes: z.string().min(1, 'Notes are required').max(VALIDATION_LIMITS.CONTENT_MAX_LENGTH),
  actionItems: z.string().optional(),
  tags: z.string().optional(),
});

export type CreateMeetingNoteInput = z.infer<typeof CreateMeetingNoteSchema>;
