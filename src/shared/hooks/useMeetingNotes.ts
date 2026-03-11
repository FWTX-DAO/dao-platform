import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMeetingNotes as getMeetingNotesAction,
  getMeetingNoteById as getMeetingNoteByIdAction,
  createMeetingNote as createMeetingNoteAction,
  updateMeetingNote as updateMeetingNoteAction,
  deleteMeetingNote as deleteMeetingNoteAction,
} from "@/app/_actions/meeting-notes";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  attendees: string | null;
  agenda: string | null;
  notes: string;
  actionItems: string | null;
  tags: string | null;
  author_name: string | null;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MeetingNoteInput {
  title: string;
  date: string;
  attendees?: string | string[];
  agenda?: string;
  notes: string;
  actionItems?: string | string[];
  tags?: string | string[];
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export const useMeetingNotes = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.meetingNotes.list(),
    queryFn: () => getMeetingNotesAction() as unknown as Promise<MeetingNote[]>,
    enabled: authReady,
    staleTime: 1000 * 60 * 3,
  });
};

export const useMeetingNote = (id: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.meetingNotes.detail(id!),
    queryFn: () =>
      getMeetingNoteByIdAction(id!) as unknown as Promise<MeetingNote | null>,
    enabled: authReady && !!id,
    staleTime: 1000 * 60,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export const useCreateMeetingNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteData: MeetingNoteInput) =>
      createMeetingNoteAction({
        title: noteData.title,
        date: noteData.date,
        attendees: Array.isArray(noteData.attendees)
          ? noteData.attendees.join(", ")
          : noteData.attendees,
        agenda: noteData.agenda,
        notes: noteData.notes,
        actionItems: Array.isArray(noteData.actionItems)
          ? noteData.actionItems.join(", ")
          : noteData.actionItems,
        tags: Array.isArray(noteData.tags)
          ? noteData.tags.join(", ")
          : noteData.tags,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetingNotes.all() });
    },
  });
};

export const useUpdateMeetingNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<MeetingNoteInput>) =>
      updateMeetingNoteAction(id, {
        title: data.title,
        date: data.date,
        attendees: Array.isArray(data.attendees)
          ? data.attendees.join(", ")
          : data.attendees,
        agenda: data.agenda,
        notes: data.notes,
        actionItems: Array.isArray(data.actionItems)
          ? data.actionItems.join(", ")
          : data.actionItems,
        tags: Array.isArray(data.tags) ? data.tags.join(", ") : data.tags,
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetingNotes.all() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.meetingNotes.detail(variables.id),
      });
    },
  });
};

export const useDeleteMeetingNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMeetingNoteAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetingNotes.all() });
    },
  });
};
