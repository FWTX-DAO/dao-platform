import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError, NotFoundError, ForbiddenError } from "@core/errors/AppError";
import { db, innovationBounties, users, members } from "@core/database";
import { eq, sql } from "drizzle-orm";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user;

  // Check if user is an admin/screener
  const memberInfo = await db
    .select()
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);

  const isAdmin = memberInfo.length > 0 &&
    (memberInfo[0]?.membershipType === "council" ||
     (Array.isArray(memberInfo[0]?.specialRoles) && memberInfo[0]?.specialRoles.includes("screener")));

  if (!isAdmin) {
    throw new ForbiddenError("Unauthorized - Admin access required");
  }

  if (req.method === "GET") {
    const screeningBounties = await db
      .select({
        id: innovationBounties.id,
        title: innovationBounties.title,
        organizationName: innovationBounties.organizationName,
        organizationType: innovationBounties.organizationType,
        organizationContact: innovationBounties.organizationContact,
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
        screeningNotes: innovationBounties.screeningNotes,
        submitterId: innovationBounties.submitterId,
        submitterName: users.username,
        submitterEmail: users.id,
        createdAt: innovationBounties.createdAt,
      })
      .from(innovationBounties)
      .leftJoin(users, eq(innovationBounties.submitterId, users.id))
      .where(eq(innovationBounties.status, "screening"))
      .orderBy(innovationBounties.createdAt);

    return res.status(200).json(screeningBounties);
  }

  if (req.method === "POST") {
    const { bountyId, action, screeningNotes, category } = req.body;

    if (!bountyId || !action) {
      throw new ValidationError("Bounty ID and action are required");
    }

    if (action !== "approve" && action !== "reject" && action !== "request_changes") {
      throw new ValidationError("Invalid action");
    }

    const bounty = await db
      .select()
      .from(innovationBounties)
      .where(eq(innovationBounties.id, bountyId))
      .limit(1);

    if (bounty.length === 0) {
      throw new NotFoundError("Bounty");
    }

    if (bounty[0]!.status !== "screening") {
      throw new ValidationError("Bounty is not in screening status");
    }

    const updates: any = {
      screeningNotes: screeningNotes || null,
      screenedBy: user.id,
      screenedAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (action === "approve") {
      updates.status = "published";
      updates.publishedAt = sql`CURRENT_TIMESTAMP`;
      if (category) updates.category = category;
    } else if (action === "reject") {
      updates.status = "draft";
    } else if (action === "request_changes") {
      updates.status = "draft";
    }

    await db
      .update(innovationBounties)
      .set(updates)
      .where(eq(innovationBounties.id, bountyId));

    const updatedBounty = await db
      .select()
      .from(innovationBounties)
      .where(eq(innovationBounties.id, bountyId))
      .limit(1);

    return res.status(200).json({
      message: `Bounty ${action}ed successfully`,
      bounty: updatedBounty[0],
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);
