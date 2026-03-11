"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateMeetingNote } from "@hooks/useMeetingNotes";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";

export default function NewMeetingNotePage() {
  const router = useRouter();
  const createMutation = useCreateMeetingNote();
  const { can } = useEntitlements();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    attendees: "",
    agenda: "",
    notes: "",
    actionItems: "",
    tags: "",
  });

  if (!can.createMeetingNote) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">New Meeting Note</h1>
        <UpgradeCTA
          allowed={false}
          feature="create meeting notes"
          mode="banner"
        >
          <span />
        </UpgradeCTA>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(formData, {
      onSuccess: (result: any) => {
        if (result && !result.success) {
          setError(result.error);
          return;
        }
        router.push(
          result?.data?.id
            ? `/meeting-notes/${result.data.id}`
            : "/meeting-notes",
        );
      },
    });
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        New Meeting Note
      </h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="note-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            id="note-title"
            type="text"
            required
            value={formData.title}
            onChange={set("title")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="note-date"
            className="block text-sm font-medium text-gray-700"
          >
            Date *
          </label>
          <input
            id="note-date"
            type="date"
            required
            value={formData.date}
            onChange={set("date")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="note-attendees"
            className="block text-sm font-medium text-gray-700"
          >
            Attendees (comma separated)
          </label>
          <input
            id="note-attendees"
            type="text"
            value={formData.attendees}
            onChange={set("attendees")}
            placeholder="Alice, Bob, Charlie"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="note-agenda"
            className="block text-sm font-medium text-gray-700"
          >
            Agenda
          </label>
          <textarea
            id="note-agenda"
            value={formData.agenda}
            onChange={set("agenda")}
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="note-notes"
            className="block text-sm font-medium text-gray-700"
          >
            Notes *
          </label>
          <textarea
            id="note-notes"
            required
            value={formData.notes}
            onChange={set("notes")}
            rows={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="note-actions"
            className="block text-sm font-medium text-gray-700"
          >
            Action Items (comma separated)
          </label>
          <input
            id="note-actions"
            type="text"
            value={formData.actionItems}
            onChange={set("actionItems")}
            placeholder="Follow up with X, Review Y"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="note-tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags (comma separated)
          </label>
          <input
            id="note-tags"
            type="text"
            value={formData.tags}
            onChange={set("tags")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            {createMutation.isPending
              ? "Creating…"
              : "Create Meeting Note"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
