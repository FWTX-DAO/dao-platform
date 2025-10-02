import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "@utils/api-helpers";
import { sanitizeMeetingNoteInput } from "@utils/utils";
import { getOrCreateUser } from "@core/database/queries/users";
import { db, meetingNotes, users } from "@core/database";
import { eq, sql } from "drizzle-orm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const privyDid = claims.userId;
    const email = (claims as any).email || undefined;

    // Get or create user
    const user = await getOrCreateUser(privyDid, email);

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
    
    else if (req.method === "POST") {
      // Create new meeting note
      const rawInput = req.body;

      if (!rawInput.title || !rawInput.date || !rawInput.notes) {
        return res.status(400).json({ 
          error: "Title, date, and notes are required" 
        });
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(rawInput.date)) {
        return res.status(400).json({
          error: "Invalid date format. Use YYYY-MM-DD format."
        });
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
        return res.status(400).json({
          error: "Title and notes cannot be empty after sanitization"
        });
      }

      const noteId = generateId();
      const attendeesString = sanitizedInput.attendees.join(",");
      const actionItemsString = sanitizedInput.actionItems.join("\n");
      const tagsString = sanitizedInput.tags.join(",");

      const newNote = await db.insert(meetingNotes).values({
        id: noteId,
        authorId: user!.id,
        title: sanitizedInput.title,
        date: sanitizedInput.date,
        attendees: attendeesString,
        agenda: sanitizedInput.agenda,
        notes: sanitizedInput.notes,
        actionItems: actionItemsString,
        tags: tagsString,
      }).returning();

      // Return the created note with author info
      const noteWithAuthor = {
        ...newNote[0],
        action_items: newNote[0]!.actionItems,
        author_name: user!.username,
        author_avatar: user!.avatarUrl,
      };

      return res.status(201).json(noteWithAuthor);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Meeting notes API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}