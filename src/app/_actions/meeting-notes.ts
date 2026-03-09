"use server";

import { requireAuth, isUserAdmin } from "@/app/_lib/auth";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/app/_lib/action-utils";
import { db, meetingNotes, users } from "@core/database";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@utils/id-generator";
import { revalidatePath } from "next/cache";
import { activitiesService } from "@services/activities";

// ============================================================================
// QUERIES (return data directly — auth failure triggers redirect)
// ============================================================================

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

export async function getMeetingNoteById(id: string) {
  await requireAuth();

  const note = await db
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
      updatedAt: meetingNotes.updatedAt,
    })
    .from(meetingNotes)
    .leftJoin(users, eq(meetingNotes.authorId, users.id))
    .where(eq(meetingNotes.id, id))
    .limit(1);

  return note[0] || null;
}

// ============================================================================
// MUTATIONS (return ActionResult<T> — never throw raw errors)
// ============================================================================

export async function createMeetingNote(data: {
  title: string;
  date: string;
  attendees?: string;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  tags?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    const id = generateId();

    await db.insert(meetingNotes).values({
      id,
      authorId: user.id,
      title: data.title,
      date: data.date,
      attendees: data.attendees || null,
      agenda: data.agenda || null,
      notes: data.notes || "",
      actionItems: data.actionItems || null,
      tags: data.tags || null,
    });

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "meeting_created", "meeting", id)
      .catch(() => {});

    revalidatePath("/meeting-notes");
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateMeetingNote(
  id: string,
  data: {
    title?: string;
    date?: string;
    attendees?: string;
    agenda?: string;
    notes?: string;
    actionItems?: string;
    tags?: string;
  },
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const note = await db
      .select({ authorId: meetingNotes.authorId })
      .from(meetingNotes)
      .where(eq(meetingNotes.id, id))
      .limit(1);

    if (!note[0]) return actionError(new Error("Meeting note not found"));

    const admin = await isUserAdmin(user.id);
    if (note[0].authorId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    const allowedFields = [
      "title",
      "date",
      "attendees",
      "agenda",
      "notes",
      "actionItems",
      "tags",
    ];
    const safeData = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowedFields.includes(k)),
    );

    await db
      .update(meetingNotes)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(meetingNotes.id, id));

    revalidatePath("/meeting-notes");
    revalidatePath(`/meeting-notes/${id}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteMeetingNote(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const note = await db
      .select({ authorId: meetingNotes.authorId })
      .from(meetingNotes)
      .where(eq(meetingNotes.id, id))
      .limit(1);

    if (!note[0]) return actionError(new Error("Meeting note not found"));

    const admin = await isUserAdmin(user.id);
    if (note[0].authorId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    await db.delete(meetingNotes).where(eq(meetingNotes.id, id));
    revalidatePath("/meeting-notes");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}
