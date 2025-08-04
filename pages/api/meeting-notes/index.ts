import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "../../../lib/api-helpers";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, meetingNotes, users } from "../../../src/db";
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
      const { title, date, attendees, agenda, notes, actionItems, tags } = req.body;

      if (!title || !date || !notes) {
        return res.status(400).json({ 
          error: "Title, date, and notes are required" 
        });
      }

      const noteId = generateId();
      const attendeesString = Array.isArray(attendees) ? attendees.join(",") : attendees || "";
      const actionItemsString = Array.isArray(actionItems) ? actionItems.join("\n") : actionItems || "";
      const tagsString = Array.isArray(tags) ? tags.join(",") : tags || "";

      const newNote = await db.insert(meetingNotes).values({
        id: noteId,
        authorId: user!.id,
        title,
        date,
        attendees: attendeesString,
        agenda: agenda || "",
        notes,
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