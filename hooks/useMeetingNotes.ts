import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";

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

const fetchMeetingNotes = async (): Promise<MeetingNote[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/meeting-notes", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch meeting notes: ${response.statusText}`);
  }

  return response.json();
};

const createMeetingNote = async (noteData: MeetingNoteInput): Promise<MeetingNote> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/meeting-notes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(noteData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create meeting note: ${response.statusText}`);
  }

  return response.json();
};

// Query Hooks
export const useMeetingNotes = () => {
  return useQuery({
    queryKey: ["meeting-notes"],
    queryFn: fetchMeetingNotes,
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
};

// Mutation Hooks
export const useCreateMeetingNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMeetingNote,
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
    onSuccess: (newNote) => {
      queryClient.setQueryData(["meeting-notes"], (oldData: MeetingNote[] | undefined) => {
        return oldData ? [newNote, ...oldData.filter(n => !n.id.startsWith('temp-'))] : [newNote];
      });
    },
  });
};