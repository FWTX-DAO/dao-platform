"use client";

import { useParams, useRouter } from "next/navigation";
import { useMeetingNote, useDeleteMeetingNote } from "@hooks/useMeetingNotes";
import Link from "next/link";

export default function MeetingNoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: note, isLoading } = useMeetingNote(id);
  const deleteMutation = useDeleteMeetingNote();

  if (isLoading)
    return (
      <div className="py-8 text-center text-gray-500">Loading{"\u2026"}</div>
    );
  if (!note)
    return (
      <div className="py-8 text-center text-gray-500">
        Meeting note not found
      </div>
    );

  const n = note as any;

  const handleDelete = () => {
    if (!confirm("Delete this meeting note?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/meeting-notes"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{n.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span>{n.date}</span>
            <span>by {n.author_name || "Anonymous"}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/meeting-notes/${id}/edit`}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => router.back()}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {n.attendees && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Attendees
          </h2>
          <div className="flex flex-wrap gap-2">
            {n.attendees.split(",").map((a: string) => (
              <span
                key={a}
                className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {a.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {n.agenda && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Agenda</h2>
          <p className="text-gray-700 whitespace-pre-line">{n.agenda}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
        <p className="text-gray-700 whitespace-pre-line">{n.notes}</p>
      </div>

      {n.actionItems && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Action Items
          </h2>
          <ul className="list-disc list-inside space-y-1">
            {n.actionItems.split(",").map((item: string, i: number) => (
              <li key={i} className="text-gray-700 text-sm">
                {item.trim()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {n.tags && (
        <div className="flex flex-wrap gap-2">
          {n.tags.split(",").map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
