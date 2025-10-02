import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "@components/AppLayout";
import { 
  DocumentTextIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { useMeetingNotes, useCreateMeetingNote } from "@hooks/useMeetingNotes";
import { useMembers, type Member } from "@hooks/useMembers";

interface Attendee {
  id: string;
  name: string;
  type: 'member' | 'guest';
  memberId?: string;
}

export default function MeetingNotesPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  
  // React Query hooks
  const { 
    data: notes = [], 
    isLoading, 
    error: notesError 
  } = useMeetingNotes();
  
  const { data: members = [] } = useMembers();
  const createNoteMutation = useCreateMeetingNote();

  // UI state
  const [showCreateNote, setShowCreateNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [error, setError] = useState("");
  const [selectedAttendees, setSelectedAttendees] = useState<Attendee[]>([]);
  const [guestName, setGuestName] = useState("");
  
  // Form state
  const [newNote, setNewNote] = useState({
    title: "",
    date: "",
    agenda: "",
    notes: "",
    actionItems: "",
    tags: "",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Handle query errors
  useEffect(() => {
    if (notesError) {
      setError("Failed to load meeting notes");
    }
  }, [notesError]);

  const handleCreateNote = () => {
    if (newNote.title.trim() && newNote.date && newNote.notes.trim()) {
      setError("");
      
      createNoteMutation.mutate({
        title: newNote.title,
        date: newNote.date,
        attendees: selectedAttendees.map(a => a.name),
        agenda: newNote.agenda,
        notes: newNote.notes,
        actionItems: newNote.actionItems.split("\n").map(a => a.trim()).filter(Boolean),
        tags: newNote.tags.split(",").map(t => t.trim()).filter(Boolean),
      }, {
        onSuccess: () => {
          setNewNote({
            title: "",
            date: "",
            agenda: "",
            notes: "",
            actionItems: "",
            tags: "",
          });
          setSelectedAttendees([]);
          setGuestName("");
          setShowCreateNote(false);
        },
        onError: () => {
          setError("Failed to create meeting note. Please try again.");
        }
      });
    }
  };

  const addMemberAttendee = (member: Member) => {
    const isAlreadySelected = selectedAttendees.some(a => a.id === member.id);
    if (!isAlreadySelected) {
      setSelectedAttendees([...selectedAttendees, {
        id: member.id,
        name: member.username || `Member ${member.id}`,
        type: 'member',
        memberId: member.id
      }]);
    }
  };

  const addGuestAttendee = () => {
    if (guestName.trim()) {
      const guestId = `guest-${Date.now()}`;
      setSelectedAttendees([...selectedAttendees, {
        id: guestId,
        name: guestName.trim(),
        type: 'guest'
      }]);
      setGuestName("");
    }
  };

  const removeAttendee = (attendeeId: string) => {
    setSelectedAttendees(selectedAttendees.filter(a => a.id !== attendeeId));
  };

  const getAllTags = () => {
    const tagsSet = new Set<string>();
    notes.forEach(note => {
      if (note.tags) {
        note.tags.split(",").forEach(tag => tagsSet.add(tag.trim()));
      }
    });
    return Array.from(tagsSet);
  };

  const allTags = getAllTags();

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === "" || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.agenda.toLowerCase().includes(searchTerm.toLowerCase());
    
    const noteTags = note.tags ? note.tags.split(",").map(t => t.trim()) : [];
    const matchesTag = selectedTag === "" || noteTags.includes(selectedTag);
    
    return matchesSearch && matchesTag;
  });

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Meeting Notes - Fort Worth TX DAO">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meeting Notes</h1>
            <p className="mt-2 text-gray-600">Track decisions and action items from DAO meetings</p>
          </div>
          <button
            onClick={() => setShowCreateNote(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Meeting Note
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search meeting notes..."
                className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Create Note Modal */}
        {showCreateNote && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-3xl w-full p-6 my-8">
              <h2 className="text-xl font-bold mb-4">Create Meeting Note</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Meeting Title <span className="text-xs text-gray-500">({newNote.title.length}/200)</span>
                    </label>
                    <input
                      type="text"
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value.slice(0, 200) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={newNote.date}
                      onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                  
                  {/* DAO Members Dropdown */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">DAO Members</label>
                    <select
                      onChange={(e) => {
                        const member = members.find(m => m.id === e.target.value);
                        if (member) {
                          addMemberAttendee(member);
                          e.target.value = '';
                        }
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                      defaultValue=""
                    >
                      <option value="">Select a DAO member...</option>
                      {members
                        .filter(member => !selectedAttendees.some(a => a.memberId === member.id))
                        .map(member => (
                        <option key={member.id} value={member.id}>
                          {member.username} ({member.membershipType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Guest Input */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Add Guest</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addGuestAttendee()}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                        placeholder="Guest name"
                      />
                      <button
                        type="button"
                        onClick={addGuestAttendee}
                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Selected Attendees */}
                  {selectedAttendees.length > 0 && (
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-xs font-medium text-gray-600 mb-2">Selected Attendees:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedAttendees.map(attendee => (
                          <span
                            key={attendee.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                              attendee.type === 'member' 
                                ? 'bg-violet-100 text-violet-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {attendee.name}
                            <button
                              type="button"
                              onClick={() => removeAttendee(attendee.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Agenda <span className="text-xs text-gray-500">({newNote.agenda.length}/2000)</span>
                  </label>
                  <textarea
                    value={newNote.agenda}
                    onChange={(e) => setNewNote({ ...newNote, agenda: e.target.value.slice(0, 2000) })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="1. Topic one&#10;2. Topic two&#10;3. Topic three"
                    maxLength={2000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Meeting Notes <span className="text-xs text-gray-500">({newNote.notes.length}/10000)</span>
                  </label>
                  <textarea
                    value={newNote.notes}
                    onChange={(e) => setNewNote({ ...newNote, notes: e.target.value.slice(0, 10000) })}
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    maxLength={10000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Action Items (one per line) <span className="text-xs text-gray-500">({newNote.actionItems.length}/4000)</span>
                  </label>
                  <textarea
                    value={newNote.actionItems}
                    onChange={(e) => setNewNote({ ...newNote, actionItems: e.target.value.slice(0, 4000) })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="Schedule follow-up meeting&#10;Prepare budget proposal&#10;Contact stakeholders"
                    maxLength={4000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tags (comma-separated) <span className="text-xs text-gray-500">({newNote.tags.length}/500)</span>
                  </label>
                  <input
                    type="text"
                    value={newNote.tags}
                    onChange={(e) => setNewNote({ ...newNote, tags: e.target.value.slice(0, 500) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="planning, budget, technical"
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreateNote(false)}
                    disabled={createNoteMutation.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNote}
                    disabled={createNoteMutation.isPending || !newNote.title.trim() || !newNote.date || !newNote.notes.trim()}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    {createNoteMutation.isPending ? "Creating..." : "Create Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading meeting notes...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : notes.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No meeting notes yet. Create your first one!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map(note => {
              const attendeesList = note.attendees ? note.attendees.split(",").map(a => a.trim()).filter(Boolean) : [];
              const actionItemsList = note.action_items ? note.action_items.split("\n").map(a => a.trim()).filter(Boolean) : [];
              const tagsList = note.tags ? note.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
              
              return (
                <div key={note.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(note.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="h-4 w-4" />
                          {attendeesList.length} attendees
                        </div>
                      </div>
                    </div>
                    <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                  </div>

                  {note.agenda && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Agenda</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{note.agenda}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                    <p className="text-sm text-gray-600">{note.notes}</p>
                  </div>

                  {actionItemsList.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Action Items</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {actionItemsList.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {tagsList.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      by {note.author_name || "Anonymous"} • {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}