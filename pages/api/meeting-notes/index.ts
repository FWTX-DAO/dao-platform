import type { NextApiResponse } from "next";
import {
  compose,
  errorHandler,
  withAuth,
  type AuthenticatedRequest,
} from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { generateId } from "@utils/id-generator";
import { sanitizeMeetingNoteInput } from "@utils/utils";
import { db, meetingNotes, users } from "@core/database";
import { eq, sql } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;

  if (req.method === "GET") {
    // Get all meeting notes
    const notesList = await db
      .select({
        id: meetingNotes.id,
        title: meetingNotes.title,
        date: meetingNotes.date,
        attendees: meetingNotes.attendees,
        agenda: meetingNotes.agenda,
        notes: meetingNotes.notes,
        action_items: meetingNotes.actionItems,
        tags: meetingNotes.tags,
        author_id: meetingNotes.authorId,
        author_name: users.username,
        author_avatar: users.avatarUrl,
        created_at: meetingNotes.createdAt,
        updated_at: meetingNotes.updatedAt,
      })
      .from(meetingNotes)
      .leftJoin(users, eq(meetingNotes.authorId, users.id))
      .orderBy(sql`${meetingNotes.date} DESC, ${meetingNotes.createdAt} DESC`);

    return res.status(200).json(notesList);
  }

  if (req.method === "POST") {
    // Create new meeting note
    const rawInput = req.body;

    if (!rawInput.title || !rawInput.date || !rawInput.notes) {
      throw new ValidationError("Title, date, and notes are required");
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(rawInput.date)) {
      throw new ValidationError(
        "Invalid date format. Use YYYY-MM-DD format."
      );
    }

    // Sanitize all input data
    const sanitizedInput = sanitizeMeetingNoteInput({
      title: rawInput.title,
      date: rawInput.date,
      attendees: rawInput.attendees,
      agenda: rawInput.agenda,
      notes: rawInput.notes,
      actionItems: rawInput.actionItems,
      tags: rawInput.tags,
    });

    // Additional validation after sanitization
    if (!sanitizedInput.title || !sanitizedInput.notes) {
      throw new ValidationError(
        "Title and notes cannot be empty after sanitization"
      );
    }

    const noteId = generateId();
    const attendeesString = sanitizedInput.attendees.join(",");
    const actionItemsString = sanitizedInput.actionItems.join("\n");
    const tagsString = sanitizedInput.tags.join(",");

    const newNote = await db
      .insert(meetingNotes)
      .values({
        id: noteId,
        authorId: user.id,
        title: sanitizedInput.title,
        date: sanitizedInput.date,
        attendees: attendeesString,
        agenda: sanitizedInput.agenda,
        notes: sanitizedInput.notes,
        actionItems: actionItemsString,
        tags: tagsString,
      })
      .returning();

    // Return the created note with author info
    const noteWithAuthor = {
      ...newNote[0],
      action_items: newNote[0]!.actionItems,
      author_name: user.username,
      author_avatar: user.avatarUrl,
    };

    return res.status(201).json(noteWithAuthor);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
