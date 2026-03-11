'use client';

import { useState } from 'react';
import { useIssueStamps } from '@shared/hooks/usePassportStamps';
import { EVENT_TYPES } from '@services/stamps/types';
import { Button } from '@components/ui/button';

export default function AdminStampsPage() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<string>('meetup');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(5);
  const [emailsText, setEmailsText] = useState('');
  const [result, setResult] = useState<{ issued: number; notFound: string[] } | null>(null);
  const [error, setError] = useState('');

  const { mutate: issue, isPending } = useIssueStamps();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);

    const emails = emailsText
      .split(/[,\n]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      setError('Please provide at least one email address');
      return;
    }

    if (!eventName.trim()) {
      setError('Event name is required');
      return;
    }

    issue(
      {
        emails,
        eventName: eventName.trim(),
        eventDate: eventDate || new Date().toISOString(),
        eventType: eventType as any,
        description: description.trim() || undefined,
        pointsAwarded: points,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setResult(res.data);
            setEmailsText('');
          } else {
            setError(res.error);
          }
        },
        onError: (err) => {
          setError(err.message);
        },
      },
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="font-display text-2xl text-gray-900 mb-1">Issue Passport Stamps</h1>
      <p className="text-sm text-gray-500 mb-8">
        Award event attendance stamps to members by providing their email addresses.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Event Name */}
        <div>
          <label htmlFor="stamp-event-name" className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
          <input
            id="stamp-event-name"
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="DAO Town Hall #4"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-dao-gold focus:ring-1 focus:ring-dao-gold outline-hidden focus-visible:ring-2 focus-visible:ring-dao-gold"
            required
          />
        </div>

        {/* Event Date + Type row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stamp-event-date" className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
            <input
              id="stamp-event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-dao-gold focus:ring-1 focus:ring-dao-gold outline-hidden focus-visible:ring-2 focus-visible:ring-dao-gold"
            />
          </div>
          <div>
            <label htmlFor="stamp-event-type" className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              id="stamp-event-type"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-dao-gold focus:ring-1 focus:ring-dao-gold outline-hidden focus-visible:ring-2 focus-visible:ring-dao-gold bg-white"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="stamp-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="stamp-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Monthly community gathering at Panther Island Pavilion"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-dao-gold focus:ring-1 focus:ring-dao-gold outline-hidden focus-visible:ring-2 focus-visible:ring-dao-gold"
          />
        </div>

        {/* Points */}
        <div>
          <label htmlFor="stamp-points" className="block text-sm font-medium text-gray-700 mb-1">Points Awarded</label>
          <input
            id="stamp-points"
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            min={0}
            max={100}
            className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-dao-gold focus:ring-1 focus:ring-dao-gold outline-hidden focus-visible:ring-2 focus-visible:ring-dao-gold"
          />
        </div>

        {/* Emails */}
        <div>
          <label htmlFor="stamp-emails" className="block text-sm font-medium text-gray-700 mb-1">
            Attendee Emails
          </label>
          <p className="text-xs text-gray-400 mb-2">
            One per line or comma-separated. Only members with matching emails will receive stamps.
          </p>
          <textarea
            id="stamp-emails"
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            rows={6}
            placeholder={"alice@example.com\nbob@example.com\ncharlie@example.com"}
            spellCheck={false}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-dao-gold focus:ring-1 focus:ring-dao-gold outline-hidden focus-visible:ring-2 focus-visible:ring-dao-gold resize-y"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 space-y-2">
            <p className="font-medium">
              {result.issued} stamp{result.issued !== 1 ? 's' : ''} issued successfully.
            </p>
            {result.notFound.length > 0 && (
              <div>
                <p className="text-yellow-700 font-medium">
                  {result.notFound.length} email{result.notFound.length !== 1 ? 's' : ''} not found:
                </p>
                <ul className="list-disc list-inside text-yellow-600 text-xs mt-1">
                  {result.notFound.map((email) => (
                    <li key={email}>{email}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Issuing Stamps…' : 'Issue Stamps'}
        </Button>
      </form>
    </div>
  );
}
