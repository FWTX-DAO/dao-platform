import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError, NotFoundError, ForbiddenError } from "@core/errors/AppError";
import { generateId } from "@utils/api-helpers";
import { db, innovationBounties, users, members } from "@core/database";
import { eq, sql, and, or, like } from "drizzle-orm";

async function isUserAdmin(userId: string): Promise<boolean> {
  const memberInfo = await db
    .select()
    .from(members)
    .where(eq(members.userId, userId))
    .limit(1);

  if (memberInfo.length === 0) return false;

  const member = memberInfo[0]!;
  const isCouncil = member.membershipType === "council";
  const isScreener = Array.isArray(member.specialRoles) && member.specialRoles.includes("screener");

  return isCouncil || isScreener;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;

  if (req.method === "GET") {
    const { status, category, organizationType, search, limit: limitParam, offset: offsetParam } = req.query;

    const DEFAULT_PAGE_SIZE = 20;
    const MAX_PAGE_SIZE = 100;
    const limit = Math.min(parseInt(limitParam as string) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const offset = parseInt(offsetParam as string) || 0;

    const requestsAllBounties = req.query.includeAll === 'true';
    const isAdmin = await isUserAdmin(user.id);

    const conditions = [];

    if (requestsAllBounties && isAdmin) {
      // Admin requesting all - no status filter
    } else {
      conditions.push(
        or(
          eq(innovationBounties.status, "published"),
          eq(innovationBounties.status, "assigned"),
          eq(innovationBounties.status, "completed"),
          eq(innovationBounties.submitterId, user.id)
        )
      );
    }

    if (status && status !== "all") {
      conditions.push(eq(innovationBounties.status, status as string));
    }
    if (category && category !== "all") {
      conditions.push(eq(innovationBounties.category, category as string));
    }
    if (organizationType && organizationType !== "all") {
      conditions.push(eq(innovationBounties.organizationType, organizationType as string));
    }
    if (search) {
      conditions.push(
        or(
          like(innovationBounties.title, `%${search}%`),
          like(innovationBounties.problemStatement, `%${search}%`),
          like(innovationBounties.organizationName, `%${search}%`)
        )
      );
    }

    // List-optimized projection: excludes heavy detail fields
    // (currentState, desiredOutcome, organizationWebsite are only needed in detail view)
    const bounties = await db
      .select({
        id: innovationBounties.id,
        title: innovationBounties.title,
        organizationName: innovationBounties.organizationName,
        organizationType: innovationBounties.organizationType,
        problemStatement: innovationBounties.problemStatement,
        useCase: innovationBounties.useCase,
        bountyAmount: innovationBounties.bountyAmount,
        bountyType: innovationBounties.bountyType,
        deadline: innovationBounties.deadline,
        category: innovationBounties.category,
        tags: innovationBounties.tags,
        status: innovationBounties.status,
        viewCount: innovationBounties.viewCount,
        proposalCount: innovationBounties.proposalCount,
        isAnonymous: innovationBounties.isAnonymous,
        submitterId: innovationBounties.submitterId,
        submitterName: users.username,
        submitterAvatar: users.avatarUrl,
        createdAt: innovationBounties.createdAt,
        publishedAt: innovationBounties.publishedAt,
      })
      .from(innovationBounties)
      .leftJoin(users, eq(innovationBounties.submitterId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${innovationBounties.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const sanitizedBounties = bounties.map(bounty => ({
      ...bounty,
      submitterName: bounty.isAnonymous ? "Anonymous" : bounty.submitterName,
      submitterAvatar: bounty.isAnonymous ? null : bounty.submitterAvatar,
      submitterId: bounty.isAnonymous ? null : bounty.submitterId,
    }));

    return res.status(200).json(sanitizedBounties);
  }

  if (req.method === "POST") {
    const {
      organizationName, organizationType, organizationIndustry,
      organizationCity, organizationState, organizationContact,
      organizationWebsite, sponsorFirstName, sponsorLastName,
      sponsorEmail, sponsorPhone, sponsorTitle,
      title, problemStatement, useCase, currentState,
      commonToolsUsed, desiredOutcome, technicalRequirements,
      constraints, deliverables, bountyAmount, bountyType,
      deadline, category, tags, isAnonymous,
    } = req.body;

    if (!organizationName || !organizationType || !title || !problemStatement ||
        !useCase || !desiredOutcome) {
      throw new ValidationError("Missing required fields: organizationName, organizationType, title, problemStatement, useCase, desiredOutcome");
    }

    const bountyId = generateId();
    const bountyStatus = "published";
    const publishedAt = sql`CURRENT_TIMESTAMP`;

    const newBounty = await db.insert(innovationBounties).values({
      id: bountyId,
      organizationName, organizationType,
      organizationIndustry: organizationIndustry || null,
      organizationCity: organizationCity || null,
      organizationState: organizationState || null,
      organizationContact, organizationWebsite,
      sponsorFirstName: sponsorFirstName || null,
      sponsorLastName: sponsorLastName || null,
      sponsorEmail: sponsorEmail || null,
      sponsorPhone: sponsorPhone || null,
      sponsorTitle: sponsorTitle || null,
      title, problemStatement, useCase, currentState,
      commonToolsUsed: Array.isArray(commonToolsUsed) ? commonToolsUsed.join(",") : commonToolsUsed,
      desiredOutcome,
      technicalRequirements: technicalRequirements ?? null,
      constraints, deliverables,
      bountyAmount: bountyAmount ? Math.round(bountyAmount * 100) : null,
      bountyType: bountyType || "fixed",
      deadline: deadline ? new Date(deadline) : null,
      category,
      tags: Array.isArray(tags) ? tags.join(",") : tags,
      status: bountyStatus,
      publishedAt,
      submitterId: user.id,
      isAnonymous: !!isAnonymous,
    }).returning();

    return res.status(201).json({
      ...newBounty[0],
      submitterName: isAnonymous ? "Anonymous" : user.username,
      submitterAvatar: isAnonymous ? null : user.avatarUrl,
    });
  }

  if (req.method === "PUT") {
    const { id, ...updates } = req.body;

    if (!id) {
      throw new ValidationError("Bounty ID is required");
    }

    const existingBounty = await db
      .select()
      .from(innovationBounties)
      .where(eq(innovationBounties.id, id))
      .limit(1);

    if (existingBounty.length === 0) {
      throw new NotFoundError("Bounty");
    }

    if (existingBounty[0]!.submitterId !== user.id) {
      throw new ForbiddenError("You can only edit your own bounties");
    }

    if (existingBounty[0]!.status === "completed") {
      throw new ForbiddenError("Cannot edit completed bounties");
    }

    const processedUpdates: any = {};

    if (updates.organizationName !== undefined) processedUpdates.organizationName = updates.organizationName;
    if (updates.organizationType !== undefined) processedUpdates.organizationType = updates.organizationType;
    if (updates.organizationContact !== undefined) processedUpdates.organizationContact = updates.organizationContact;
    if (updates.organizationWebsite !== undefined) processedUpdates.organizationWebsite = updates.organizationWebsite;
    if (updates.title !== undefined) processedUpdates.title = updates.title;
    if (updates.problemStatement !== undefined) processedUpdates.problemStatement = updates.problemStatement;
    if (updates.useCase !== undefined) processedUpdates.useCase = updates.useCase;
    if (updates.currentState !== undefined) processedUpdates.currentState = updates.currentState;
    if (updates.desiredOutcome !== undefined) processedUpdates.desiredOutcome = updates.desiredOutcome;
    if (updates.constraints !== undefined) processedUpdates.constraints = updates.constraints;
    if (updates.deliverables !== undefined) processedUpdates.deliverables = updates.deliverables;
    if (updates.deadline !== undefined) processedUpdates.deadline = updates.deadline;
    if (updates.category !== undefined) processedUpdates.category = updates.category;

    if (updates.commonToolsUsed !== undefined) {
      processedUpdates.commonToolsUsed = Array.isArray(updates.commonToolsUsed)
        ? updates.commonToolsUsed.join(",")
        : updates.commonToolsUsed;
    }
    if (updates.technicalRequirements !== undefined) {
      processedUpdates.technicalRequirements = Array.isArray(updates.technicalRequirements)
        ? JSON.stringify(updates.technicalRequirements)
        : updates.technicalRequirements;
    }
    if (updates.tags !== undefined) {
      processedUpdates.tags = Array.isArray(updates.tags) ? updates.tags.join(",") : updates.tags;
    }
    if (updates.bountyAmount !== undefined) {
      processedUpdates.bountyAmount = updates.bountyAmount ? Math.round(updates.bountyAmount * 100) : null;
    }
    if (updates.bountyType !== undefined) processedUpdates.bountyType = updates.bountyType;
    if (updates.isAnonymous !== undefined) processedUpdates.isAnonymous = updates.isAnonymous ? 1 : 0;

    if (updates.submitForReview && existingBounty[0]!.status === "draft") {
      processedUpdates.status = "screening";
    }

    processedUpdates.updatedAt = sql`CURRENT_TIMESTAMP`;

    await db
      .update(innovationBounties)
      .set(processedUpdates)
      .where(eq(innovationBounties.id, id));

    const updatedBounty = await db
      .select({
        id: innovationBounties.id,
        title: innovationBounties.title,
        organizationName: innovationBounties.organizationName,
        organizationType: innovationBounties.organizationType,
        organizationWebsite: innovationBounties.organizationWebsite,
        problemStatement: innovationBounties.problemStatement,
        useCase: innovationBounties.useCase,
        currentState: innovationBounties.currentState,
        commonToolsUsed: innovationBounties.commonToolsUsed,
        desiredOutcome: innovationBounties.desiredOutcome,
        technicalRequirements: innovationBounties.technicalRequirements,
        constraints: innovationBounties.constraints,
        deliverables: innovationBounties.deliverables,
        bountyAmount: innovationBounties.bountyAmount,
        bountyType: innovationBounties.bountyType,
        deadline: innovationBounties.deadline,
        category: innovationBounties.category,
        tags: innovationBounties.tags,
        status: innovationBounties.status,
        isAnonymous: innovationBounties.isAnonymous,
        submitterId: innovationBounties.submitterId,
        submitterName: users.username,
        submitterAvatar: users.avatarUrl,
        createdAt: innovationBounties.createdAt,
        updatedAt: innovationBounties.updatedAt,
      })
      .from(innovationBounties)
      .leftJoin(users, eq(innovationBounties.submitterId, users.id))
      .where(eq(innovationBounties.id, id))
      .limit(1);

    const bounty = updatedBounty[0];
    return res.status(200).json({
      ...bounty,
      submitterName: bounty?.isAnonymous ? "Anonymous" : bounty?.submitterName,
      submitterAvatar: bounty?.isAnonymous ? null : bounty?.submitterAvatar,
      submitterId: bounty?.isAnonymous ? null : bounty?.submitterId,
    });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      throw new ValidationError("Bounty ID is required");
    }

    const existingBounty = await db
      .select()
      .from(innovationBounties)
      .where(eq(innovationBounties.id, id))
      .limit(1);

    if (existingBounty.length === 0) {
      throw new NotFoundError("Bounty");
    }

    if (existingBounty[0]!.submitterId !== user.id) {
      throw new ForbiddenError("You can only delete your own bounties");
    }

    if (existingBounty[0]!.status === "completed" || existingBounty[0]!.status === "assigned") {
      throw new ForbiddenError("Cannot delete bounties that are assigned or completed");
    }

    await db.delete(innovationBounties).where(eq(innovationBounties.id, id));
    return res.status(200).json({ message: "Bounty deleted successfully" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
