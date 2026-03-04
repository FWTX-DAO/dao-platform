'use client';

import { useMeetingNotes } from '@hooks/useMeetingNotes';
import { formatDate } from '@utils/format';

export default function MeetingNotesPage() {
  const { data: notes = [], isLoading } = useMeetingNotes();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Meeting Notes</h1>
      <p className="text-gray-600">Archive of DAO meeting notes and action items</p>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading meeting notes\u2026</div>
      ) : notes.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No meeting notes yet.</div>
      ) : (
        <div className="space-y-4">
          {notes.map((note: any) => (
            <div key={note.id} className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">{note.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{formatDate(note.date)}</p>
              {note.notes && <p className="text-gray-700 mt-2 line-clamp-3">{note.notes}</p>}
              <p className="text-xs text-gray-500 mt-2">by {note.author_name || 'Anonymous'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
