import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMeetingNotes as getMeetingNotesAction,
  createMeetingNote as createMeetingNoteAction,
} from "@/app/_actions/meeting-notes";

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  attendees: string;
  agenda: string;
  notes: string;
  action_items: string;
  tags: string;
  author_name: string;
  author_id: string;
  created_at: string;
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

export const useMeetingNotes = () => {
  return useQuery({
    queryKey: ["meeting-notes"],
    queryFn: () => getMeetingNotesAction() as Promise<MeetingNote[]>,
    staleTime: 1000 * 60 * 3,
  });
};

export const useCreateMeetingNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (noteData: MeetingNoteInput) =>
      createMeetingNoteAction({
        title: noteData.title,
        date: noteData.date,
        attendees: Array.isArray(noteData.attendees) ? noteData.attendees.join(', ') : noteData.attendees,
        agenda: noteData.agenda,
        notes: noteData.notes,
        actionItems: Array.isArray(noteData.actionItems) ? noteData.actionItems.join(', ') : noteData.actionItems,
        tags: Array.isArray(noteData.tags) ? noteData.tags.join(', ') : noteData.tags,
      }),
    onMutate: async (newNote) => {
      await queryClient.cancelQueries({ queryKey: ["meeting-notes"] });
      const previousNotes = queryClient.getQueryData<MeetingNote[]>(["meeting-notes"]);

      const optimisticNote: MeetingNote = {
        id: `temp-${Date.now()}`,
        title: newNote.title,
        date: newNote.date,
        attendees: Array.isArray(newNote.attendees) ? newNote.attendees.join(', ') : (newNote.attendees || ''),
        agenda: newNote.agenda || '',
        notes: newNote.notes,
        action_items: Array.isArray(newNote.actionItems) ? newNote.actionItems.join(', ') : (newNote.actionItems || ''),
        tags: Array.isArray(newNote.tags) ? newNote.tags.join(', ') : (newNote.tags || ''),
        author_name: 'You',
        author_id: 'temp',
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<MeetingNote[]>(["meeting-notes"], (old) =>
        old ? [optimisticNote, ...old] : [optimisticNote]
      );

      return { previousNotes };
    },
    onError: (_err, _newNote, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(["meeting-notes"], context.previousNotes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-notes"] });
    },
  });
};
