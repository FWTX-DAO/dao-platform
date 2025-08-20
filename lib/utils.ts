import { AuthTokenClaims, PrivyClient } from "@privy-io/server-auth";
import type { NextApiRequest, NextApiResponse } from "next";

export type APIError = {
  error: string;
  cause?: string;
};

/**
 * Authorizes a user to call an endpoint, returning either an error result or their verifiedClaims
 * @param req - The API request
 * @param res - The API response
 * @param client - A PrivyClient
 */
export const fetchAndVerifyAuthorization = async (
  req: NextApiRequest,
  res: NextApiResponse,
  client: PrivyClient
): Promise<AuthTokenClaims | void> => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Missing auth token." });
  }
  const authToken = header.replace(/^Bearer /, "");

  try {
    return client.verifyAuthToken(authToken);
  } catch {
    return res.status(401).json({ error: "Invalid auth token." });
  }
};

export const createPrivyClient = () => {
  return new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID as string,
    process.env.PRIVY_APP_SECRET as string,
    {
      walletApi: {
        authorizationPrivateKey: process.env.SESSION_SIGNER_SECRET,
      },
    }
  );
};

/**
 * Sanitizes text input by trimming whitespace and removing potentially harmful content
 */
export const sanitizeText = (text: string, maxLength?: number): string => {
  if (!text || typeof text !== 'string') return '';
  
  let sanitized = text
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n and \r
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }
  
  return sanitized;
};

/**
 * Sanitizes multiline text content (preserves line breaks)
 */
export const sanitizeMultilineText = (text: string, maxLength?: number): string => {
  if (!text || typeof text !== 'string') return '';
  
  let sanitized = text
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n and \r
    .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs but preserve line breaks
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks to 2
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n');
  
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim();
  }
  
  return sanitized;
};

/**
 * Sanitizes comma-separated values (like tags or attendees)
 */
export const sanitizeCommaSeparated = (text: string, maxItems?: number): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  let items = text
    .split(',')
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0);
  
  if (maxItems && items.length > maxItems) {
    items = items.slice(0, maxItems);
  }
  
  return items;
};

/**
 * Sanitizes line-separated values (like action items)
 */
export const sanitizeLineSeparated = (text: string, maxItems?: number): string[] => {
  if (!text || typeof text !== 'string') return [];
  
  let items = text
    .split(/\n|\r\n|\r/)
    .map(item => sanitizeText(item))
    .filter(item => item.length > 0);
  
  if (maxItems && items.length > maxItems) {
    items = items.slice(0, maxItems);
  }
  
  return items;
};

/**
 * Validates and sanitizes meeting note data
 */
export interface MeetingNoteInput {
  title: string;
  date: string;
  attendees?: string | string[];
  agenda?: string;
  notes: string;
  actionItems?: string | string[];
  tags?: string | string[];
}

export const sanitizeMeetingNoteInput = (input: MeetingNoteInput) => {
  const sanitized = {
    title: sanitizeText(input.title, 200),
    date: input.date, // Date validation should be done separately
    attendees: Array.isArray(input.attendees) 
      ? input.attendees.map(a => sanitizeText(a, 100)).filter(Boolean)
      : sanitizeCommaSeparated(input.attendees || '', 50),
    agenda: sanitizeMultilineText(input.agenda || '', 2000),
    notes: sanitizeMultilineText(input.notes, 10000),
    actionItems: Array.isArray(input.actionItems)
      ? input.actionItems.map(a => sanitizeText(a, 200)).filter(Boolean)
      : sanitizeLineSeparated(input.actionItems || '', 20),
    tags: Array.isArray(input.tags)
      ? input.tags.map(t => sanitizeText(t, 50)).filter(Boolean)
      : sanitizeCommaSeparated(input.tags || '', 10),
  };

  return sanitized;
};

/**
 * Validates and sanitizes forum post data
 */
export interface ForumPostInput {
  title: string;
  content: string;
  category?: string;
  parent_id?: string;
}

export const sanitizeForumPostInput = (input: ForumPostInput) => {
  const sanitized = {
    title: sanitizeText(input.title, 200),
    content: sanitizeMultilineText(input.content, 10000),
    category: input.category ? sanitizeText(input.category, 50) : 'General',
    parent_id: input.parent_id ? sanitizeText(input.parent_id, 100) : null,
  };

  return sanitized;
};

/**
 * Validates GitHub repository URL format
 */
export const validateGithubRepo = (url: string): boolean => {
  if (!url) return false;
  
  const githubPattern = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/?$/;
  return githubPattern.test(url);
};

/**
 * Validates and sanitizes project data
 */
export interface ProjectInput {
  title: string;
  description: string;
  githubRepo: string;
  intent: string;
  benefitToFortWorth: string;
  tags?: string | string[];
  status?: string;
}

export const sanitizeProjectInput = (input: ProjectInput) => {
  // Validate GitHub repo URL
  if (!validateGithubRepo(input.githubRepo)) {
    throw new Error('Invalid GitHub repository URL. Must be a valid GitHub repo URL.');
  }

  const sanitized = {
    title: sanitizeText(input.title, 200),
    description: sanitizeMultilineText(input.description, 2000),
    githubRepo: sanitizeText(input.githubRepo, 500),
    intent: sanitizeMultilineText(input.intent, 1000),
    benefitToFortWorth: sanitizeMultilineText(input.benefitToFortWorth, 1000),
    tags: Array.isArray(input.tags)
      ? input.tags.map(t => sanitizeText(t, 50)).filter(Boolean)
      : sanitizeCommaSeparated(input.tags || '', 20),
    status: input.status ? sanitizeText(input.status, 50) : 'proposed',
  };

  return sanitized;
};

/**
 * Validates and sanitizes project update data
 */
export interface ProjectUpdateInput {
  title: string;
  content: string;
  updateType?: string;
}

export const sanitizeProjectUpdateInput = (input: ProjectUpdateInput) => {
  const sanitized = {
    title: sanitizeText(input.title, 200),
    content: sanitizeMultilineText(input.content, 5000),
    updateType: input.updateType ? sanitizeText(input.updateType, 50) : 'general',
  };

  return sanitized;
};
