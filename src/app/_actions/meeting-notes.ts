'use server';

import { requireAuth } from '@/app/_lib/auth';
import { db, meetingNotes, users } from '@core/database';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '@utils/id-generator';
import { revalidatePath } from 'next/cache';

export async function getMeetingNotes() {
  await requireAuth();
  return db
    .select({
      id: meetingNotes.id,
      title: meetingNotes.title,
      date: meetingNotes.date,
      attendees: meetingNotes.attendees,
      agenda: meetingNotes.agenda,
      notes: meetingNotes.notes,
      actionItems: meetingNotes.actionItems,
      tags: meetingNotes.tags,
      author_name: users.username,
      authorId: meetingNotes.authorId,
      createdAt: meetingNotes.createdAt,
    })
    .from(meetingNotes)
    .leftJoin(users, eq(meetingNotes.authorId, users.id))
    .orderBy(desc(meetingNotes.date), desc(meetingNotes.createdAt));
}

export async function createMeetingNote(data: {
  title: string;
  date: string;
  attendees?: string;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  tags?: string;
}) {
  const { user } = await requireAuth();

  const id = generateId();

  await db.insert(meetingNotes).values({
    id,
    authorId: user.id,
    title: data.title,
    date: data.date,
    attendees: data.attendees,
    agenda: data.agenda,
    notes: data.notes || '',
    actionItems: data.actionItems,
    tags: data.tags,
  });

  revalidatePath('/meeting-notes');
  return { id };
}
