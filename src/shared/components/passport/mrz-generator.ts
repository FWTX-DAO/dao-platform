import type { PassportData } from './types';

function pad(str: string, len: number, fill = '<'): string {
  return str.slice(0, len).padEnd(len, fill);
}

function sanitize(str: string): string {
  return str.replace(/[^A-Z0-9]/g, '<').toUpperCase();
}

/**
 * Generates decorative MRZ-style lines for the passport.
 * Line 1: P<FWTXDAO<<LASTNAME<<FIRSTNAME<<<...<<<
 * Line 2: MEMBER_ID<<<MEMBERSHIP<DATE<WALLET_ADDR<<<
 * Each line is 44 characters.
 */
export function generateMRZ(data: PassportData): [string, string] {
  const LINE_LEN = 44;

  const lastName = sanitize(data.lastName || 'UNKNOWN');
  const firstName = sanitize(data.firstName || 'UNKNOWN');
  const line1Prefix = 'P<FWTXDAO<<';
  const names = `${lastName}<<${firstName}`;
  const line1 = pad(line1Prefix + names, LINE_LEN);

  const memberId = sanitize(data.memberId.slice(0, 9));
  const membership = sanitize(data.membershipType || 'MEMBER').slice(0, 8);
  const date = data.joinedAt
    ? new Date(data.joinedAt).toISOString().slice(2, 10).replace(/-/g, '')
    : '000000';
  const wallet = sanitize((data.walletAddress || '').slice(0, 10));
  const line2Raw = `${memberId}<<<${membership}<${date}<${wallet}`;
  const line2 = pad(line2Raw, LINE_LEN);

  return [line1, line2];
}
