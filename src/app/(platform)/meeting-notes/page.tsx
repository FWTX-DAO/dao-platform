"use client";

import { useState } from "react";
import Link from "next/link";
import { useMeetingNotes } from "@hooks/useMeetingNotes";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";

export default function MeetingNotesPage() {
  const { data: notes = [], isLoading } = useMeetingNotes();
  const { can } = useEntitlements();
  const [search, setSearch] = useState("");

  const filtered = search
    ? notes.filter(
        (n: any) =>
          n.title?.toLowerCase().includes(search.toLowerCase()) ||
          n.notes?.toLowerCase().includes(search.toLowerCase()),
      )
    : notes;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meeting Notes</h1>
          <p className="mt-1 text-gray-600">
            Record and share meeting outcomes
          </p>
        </div>
        <UpgradeCTA
          allowed={can.createMeetingNote}
          feature="create meeting notes"
        >
          <Link
            href="/meeting-notes/new"
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm"
          >
            New Meeting Note
          </Link>
        </UpgradeCTA>
      </div>

      <input
        type="text"
        placeholder="Search meeting notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden w-64"
      />

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading{"…"}</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No meeting notes found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((note: any) => (
            <Link
              key={note.id}
              href={`/meeting-notes/${note.id}`}
              className="block bg-white shadow-sm rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {note.title}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{note.date}</span>
                <span>by {note.author_name || "Anonymous"}</span>
                {note.attendees && (
                  <span>{note.attendees.split(",").length} attendees</span>
                )}
              </div>
              {note.notes && (
                <p className="text-gray-600 mt-2 line-clamp-2">{note.notes}</p>
              )}
              {note.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags
                    .split(",")
                    .slice(0, 4)
                    .map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
