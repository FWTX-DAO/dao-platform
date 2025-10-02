import { db } from '@core/database';
import { meetingNotes, users } from '@core/database/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { generateId } from '@shared/utils';
import type { CreateMeetingNoteInput } from '../types';

export class MeetingNotesRepository {
  async findAll() {
    return db
      .select({
        id: meetingNotes.id,
        authorId: meetingNotes.authorId,
        title: meetingNotes.title,
        date: meetingNotes.date,
        attendees: meetingNotes.attendees,
        agenda: meetingNotes.agenda,
        notes: meetingNotes.notes,
        actionItems: meetingNotes.actionItems,
        tags: meetingNotes.tags,
        authorName: users.username,
        createdAt: meetingNotes.createdAt,
        updatedAt: meetingNotes.updatedAt,
      })
      .from(meetingNotes)
      .leftJoin(users, eq(meetingNotes.authorId, users.id))
      .orderBy(desc(meetingNotes.date), desc(meetingNotes.createdAt));
  }

  async findById(id: string) {
    const results = await db
      .select()
      .from(meetingNotes)
      .where(eq(meetingNotes.id, id))
      .limit(1);
    
    return results[0] ?? null;
  }

  async search(searchTerm: string) {
    return db
      .select({
        id: meetingNotes.id,
        authorId: meetingNotes.authorId,
        title: meetingNotes.title,
        date: meetingNotes.date,
        attendees: meetingNotes.attendees,
        agenda: meetingNotes.agenda,
        notes: meetingNotes.notes,
        actionItems: meetingNotes.actionItems,
        tags: meetingNotes.tags,
        authorName: users.username,
        createdAt: meetingNotes.createdAt,
        updatedAt: meetingNotes.updatedAt,
      })
      .from(meetingNotes)
      .leftJoin(users, eq(meetingNotes.authorId, users.id))
      .where(sql`
        ${meetingNotes.title} LIKE ${'%' + searchTerm + '%'} OR
        ${meetingNotes.notes} LIKE ${'%' + searchTerm + '%'} OR
        ${meetingNotes.tags} LIKE ${'%' + searchTerm + '%'}
      `)
      .orderBy(desc(meetingNotes.date));
  }

  async create(data: CreateMeetingNoteInput, authorId: string) {
    const id = generateId();
    await db.insert(meetingNotes).values({
      id,
      authorId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return this.findById(id);
  }

  async update(id: string, data: Partial<CreateMeetingNoteInput>) {
    await db.update(meetingNotes)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(meetingNotes.id, id));
    
    return this.findById(id);
  }

  async delete(id: string) {
    await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
  }
}

export const meetingNotesRepository = new MeetingNotesRepository();
