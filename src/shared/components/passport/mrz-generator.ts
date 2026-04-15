import type { PassportData } from "./types";

function pad(str: string, len: number, fill = "<"): string {
  return str.slice(0, len).padEnd(len, fill);
}

function sanitize(str: string): string {
  return str.replace(/[^A-Z0-9]/g, "<").toUpperCase();
}

/**
 * Generates MRZ-style lines for the DAO passport.
 * Line 1: P<FWTXDAO<<LASTNAME<<FIRSTNAME<<<...<<<
 * Line 2: FULL_MEMBER_ID<MEMBERSHIP<DATE<<<...<<<
 * Each line is 44 characters (TD3 format).
 */
export function generateMRZ(data: PassportData): [string, string] {
  const LINE_LEN = 44;

  const lastName = sanitize(data.lastName || "UNKNOWN");
  const firstName = sanitize(data.firstName || "UNKNOWN");
  const line1Prefix = "P<FWTXDAO<<";
  const names = `${lastName}<<${firstName}`;
  const line1 = pad(line1Prefix + names, LINE_LEN);

  // Full member ID (UUID without dashes) as the primary identifier
  const memberId = sanitize(data.memberId.replace(/-/g, ""));
  const membership = sanitize(
    data.tierDisplayName || data.membershipType || "MEMBER",
  ).slice(0, 8);
  const date = data.joinedAt
    ? new Date(data.joinedAt).toISOString().slice(2, 10).replace(/-/g, "")
    : "000000";
  const line2Raw = `${memberId}<${membership}<${date}`;
  const line2 = pad(line2Raw, LINE_LEN);

  return [line1, line2];
}
