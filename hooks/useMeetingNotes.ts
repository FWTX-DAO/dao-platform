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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Mutation Hooks
export const useCreateMeetingNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createMeetingNote,
    onSuccess: (newNote) => {
      // Add the new note to the beginning of the list
      queryClient.setQueryData(["meeting-notes"], (oldData: MeetingNote[] | undefined) => {
        return oldData ? [newNote, ...oldData] : [newNote];
      });
    },
  });
};