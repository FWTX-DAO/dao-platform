"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { getAuthUser, requireAuth } from "@/app/_lib/auth";
import {
  type ActionResult,
  actionError,
  actionSuccess,
} from "@/app/_lib/action-utils";
import { db } from "@core/database";
import {
  memberActivities,
  members,
  passportStamps,
} from "@core/database/schema";
import { generateId } from "@utils/id-generator";

const CENTRAL_TIME_ZONE = "America/Chicago";
const ROUNDTABLE_POINTS = 10;
const ROUNDTABLE_RESOURCE_TYPE = "community_roundtable";
const CHECK_IN_WINDOW_START_MINUTES = 11 * 60 + 30;
const CHECK_IN_WINDOW_END_MINUTES = 14 * 60 + 30;

type CentralParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
};

export type RoundtableEvent = {
  id: string;
  name: string;
  startsAt: string;
  checkInOpensAt: string;
  checkInClosesAt: string;
  checkInOpen: boolean;
  timeZone: string;
  points: number;
};

export type RoundtableCheckInStatus = {
  event: RoundtableEvent;
  authenticated: boolean;
  needsOnboarding: boolean;
  canCheckIn: boolean;
  unavailableReason: string | null;
  checkedIn: boolean;
  pointsAwarded: number;
  totalPoints: number | null;
  memberName: string | null;
};

export type RoundtableCheckInResult = {
  event: RoundtableEvent;
  alreadyCheckedIn: boolean;
  pointsAwarded: number;
  totalPoints: number;
  stampId: string | null;
  activityId: string | null;
};

function getCentralParts(date = new Date()): CentralParts {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: CENTRAL_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    formatted.find((part) => part.type === type)?.value ?? "";

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: weekdayMap[value("weekday")] ?? 0,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const asUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );

  return asUtc - date.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

function getRoundtableEvent(now = new Date()): RoundtableEvent {
  const current = getCentralParts(now);
  const currentMinutes = current.hour * 60 + current.minute;
  let daysUntilWednesday = (3 - current.weekday + 7) % 7;
  if (current.weekday === 3 && currentMinutes > CHECK_IN_WINDOW_END_MINUTES) {
    daysUntilWednesday = 7;
  }

  const targetDate = new Date(
    Date.UTC(current.year, current.month - 1, current.day + daysUntilWednesday),
  );
  const year = targetDate.getUTCFullYear();
  const month = targetDate.getUTCMonth() + 1;
  const day = targetDate.getUTCDate();
  const startsAt = zonedTimeToUtc(year, month, day, 12, 0, CENTRAL_TIME_ZONE);
  const checkInOpensAt = zonedTimeToUtc(
    year,
    month,
    day,
    Math.floor(CHECK_IN_WINDOW_START_MINUTES / 60),
    CHECK_IN_WINDOW_START_MINUTES % 60,
    CENTRAL_TIME_ZONE,
  );
  const checkInClosesAt = zonedTimeToUtc(
    year,
    month,
    day,
    Math.floor(CHECK_IN_WINDOW_END_MINUTES / 60),
    CHECK_IN_WINDOW_END_MINUTES % 60,
    CENTRAL_TIME_ZONE,
  );
  const dateId = `${year}-${String(month).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}`;
  const checkInOpen =
    now.getTime() >= checkInOpensAt.getTime() &&
    now.getTime() <= checkInClosesAt.getTime();

  return {
    id: `${ROUNDTABLE_RESOURCE_TYPE}-${dateId}`,
    name: "Community Roundtable",
    startsAt: startsAt.toISOString(),
    checkInOpensAt: checkInOpensAt.toISOString(),
    checkInClosesAt: checkInClosesAt.toISOString(),
    checkInOpen,
    timeZone: CENTRAL_TIME_ZONE,
    points: ROUNDTABLE_POINTS,
  };
}

function getUnavailableReason(event: RoundtableEvent) {
  if (event.checkInOpen) return null;
  return "Check-in is available Wednesdays from 11:30 AM to 2:30 PM CT.";
}

async function getExistingCheckIn(memberId: string, eventId: string) {
  const rows = await db
    .select({
      id: memberActivities.id,
      pointsAwarded: memberActivities.pointsAwarded,
    })
    .from(memberActivities)
    .where(
      and(
        eq(memberActivities.memberId, memberId),
        eq(memberActivities.activityType, "event_attended"),
        eq(memberActivities.resourceType, ROUNDTABLE_RESOURCE_TYPE),
        eq(memberActivities.resourceId, eventId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getRoundtableCheckInStatus(): Promise<RoundtableCheckInStatus> {
  const event = getRoundtableEvent();
  const auth = await getAuthUser();

  if (!auth) {
    return {
      event,
      authenticated: false,
      needsOnboarding: false,
      canCheckIn: event.checkInOpen,
      unavailableReason: getUnavailableReason(event),
      checkedIn: false,
      pointsAwarded: event.points,
      totalPoints: null,
      memberName: null,
    };
  }

  const memberRows = await db
    .select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      onboardingStatus: members.onboardingStatus,
      contributionPoints: members.contributionPoints,
    })
    .from(members)
    .where(eq(members.userId, auth.user.id))
    .limit(1);
  const member = memberRows[0];

  if (!member || member.onboardingStatus !== "completed") {
    return {
      event,
      authenticated: true,
      needsOnboarding: true,
      canCheckIn: event.checkInOpen,
      unavailableReason: getUnavailableReason(event),
      checkedIn: false,
      pointsAwarded: event.points,
      totalPoints: member?.contributionPoints ?? 0,
      memberName: null,
    };
  }

  const existing = await getExistingCheckIn(member.id, event.id);

  return {
    event,
    authenticated: true,
    needsOnboarding: false,
    canCheckIn: event.checkInOpen,
    unavailableReason: getUnavailableReason(event),
    checkedIn: !!existing,
    pointsAwarded: existing?.pointsAwarded ?? event.points,
    totalPoints: member.contributionPoints,
    memberName:
      [member.firstName, member.lastName].filter(Boolean).join(" ") || null,
  };
}

export async function checkInToRoundtable(): Promise<
  ActionResult<RoundtableCheckInResult>
> {
  try {
    const event = getRoundtableEvent();
    const { user } = await requireAuth();

    if (!event.checkInOpen) {
      return {
        success: false,
        error: getUnavailableReason(event) ?? "Check-in is closed.",
      };
    }

    const memberRows = await db
      .select({
        id: members.id,
        onboardingStatus: members.onboardingStatus,
        contributionPoints: members.contributionPoints,
      })
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1);
    const member = memberRows[0];

    if (!member || member.onboardingStatus !== "completed") {
      return {
        success: false,
        error: "Complete your member profile before checking in.",
      };
    }

    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM members WHERE id = ${member.id} FOR UPDATE`,
      );

      const [lockedMember] = await tx
        .select({
          contributionPoints: members.contributionPoints,
        })
        .from(members)
        .where(eq(members.id, member.id))
        .limit(1);

      const [existing] = await tx
        .select({
          id: memberActivities.id,
          pointsAwarded: memberActivities.pointsAwarded,
        })
        .from(memberActivities)
        .where(
          and(
            eq(memberActivities.memberId, member.id),
            eq(memberActivities.activityType, "event_attended"),
            eq(memberActivities.resourceType, ROUNDTABLE_RESOURCE_TYPE),
            eq(memberActivities.resourceId, event.id),
          ),
        )
        .limit(1);

      if (existing) {
        return {
          event,
          alreadyCheckedIn: true,
          pointsAwarded: existing.pointsAwarded,
          totalPoints:
            lockedMember?.contributionPoints ?? member.contributionPoints,
          stampId: null,
          activityId: existing.id,
        };
      }

      const now = new Date();
      const stampId = generateId();
      const activityId = generateId();
      const metadata = {
        checkInSource: "public_check_in",
        eventId: event.id,
        scheduledAt: event.startsAt,
      };

      await tx.insert(passportStamps).values({
        id: stampId,
        memberId: member.id,
        eventName: event.name,
        eventDate: new Date(event.startsAt),
        eventType: "roundtable",
        description: "Community Roundtable attendance check-in",
        issuedBy: user.id,
        pointsAwarded: event.points,
        metadata,
        createdAt: now,
      });

      await tx.insert(memberActivities).values({
        id: activityId,
        memberId: member.id,
        activityType: "event_attended",
        resourceType: ROUNDTABLE_RESOURCE_TYPE,
        resourceId: event.id,
        metadata,
        pointsAwarded: event.points,
        createdAt: now,
      });

      const [updatedMember] = await tx
        .update(members)
        .set({
          contributionPoints: sql`${members.contributionPoints} + ${event.points}`,
          updatedAt: now,
        })
        .where(eq(members.id, member.id))
        .returning({ contributionPoints: members.contributionPoints });

      return {
        event,
        alreadyCheckedIn: false,
        pointsAwarded: event.points,
        totalPoints:
          updatedMember?.contributionPoints ??
          (lockedMember?.contributionPoints ?? member.contributionPoints) +
            event.points,
        stampId,
        activityId,
      };
    });

    revalidatePath("/passport");
    revalidatePath("/activity");
    revalidatePath("/dashboard");
    revalidatePath("/check-in");

    return actionSuccess(result);
  } catch (err) {
    return actionError(err);
  }
}
