"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useMeetingNote,
  useUpdateMeetingNote,
  useDeleteMeetingNote,
} from "@hooks/useMeetingNotes";

export default function EditMeetingNotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: note, isLoading } = useMeetingNote(id);
  const updateMutation = useUpdateMeetingNote();
  const deleteMutation = useDeleteMeetingNote();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    attendees: "",
    agenda: "",
    notes: "",
    actionItems: "",
    tags: "",
  });

  useEffect(() => {
    if (note) {
      const n = note as any;
      setFormData({
        title: n.title || "",
        date: n.date || "",
        attendees: n.attendees || "",
        agenda: n.agenda || "",
        notes: n.notes || "",
        actionItems: n.actionItems || "",
        tags: n.tags || "",
      });
    }
  }, [note]);

  if (isLoading)
    return <div className="py-8 text-center text-gray-500">Loading{"…"}</div>;
  if (!note)
    return (
      <div className="py-8 text-center text-gray-500">
        Meeting note not found
      </div>
    );

  const handleSave = () => {
    setError("");
    updateMutation.mutate(
      { id, ...formData },
      {
        onSuccess: (result: any) => {
          if (result && !result.success) {
            setError(result.error);
            return;
          }
          router.push(`/meeting-notes/${id}`);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("Delete this meeting note?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/meeting-notes"),
    });
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Edit Meeting Note</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="edit-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="edit-title"
            type="text"
            value={formData.title}
            onChange={set("title")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="edit-date"
            className="block text-sm font-medium text-gray-700"
          >
            Date
          </label>
          <input
            id="edit-date"
            type="date"
            value={formData.date}
            onChange={set("date")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="edit-attendees"
            className="block text-sm font-medium text-gray-700"
          >
            Attendees (comma separated)
          </label>
          <input
            id="edit-attendees"
            type="text"
            value={formData.attendees}
            onChange={set("attendees")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="edit-agenda"
            className="block text-sm font-medium text-gray-700"
          >
            Agenda
          </label>
          <textarea
            id="edit-agenda"
            value={formData.agenda}
            onChange={set("agenda")}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="edit-notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="edit-notes"
            value={formData.notes}
            onChange={set("notes")}
            rows={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="edit-actions"
            className="block text-sm font-medium text-gray-700"
          >
            Action Items (comma separated)
          </label>
          <input
            id="edit-actions"
            type="text"
            value={formData.actionItems}
            onChange={set("actionItems")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="edit-tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags (comma separated)
          </label>
          <input
            id="edit-tags"
            type="text"
            value={formData.tags}
            onChange={set("tags")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            Delete
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
