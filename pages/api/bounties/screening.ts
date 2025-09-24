import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../lib/api-helpers";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, innovationBounties, users, members } from "../../../src/db";
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
    
    // Check if user is an admin/screener
    // For now, we'll check if they're a "council" member
    // In production, you might have a specific admin role
    const memberInfo = await db
      .select()
      .from(members)
      .where(eq(members.userId, user!.id))
      .limit(1);
    
    const isAdmin = memberInfo.length > 0 && 
      (memberInfo[0]?.membershipType === "council" || 
       memberInfo[0]?.specialRoles?.includes("screener"));

    if (!isAdmin) {
      return res.status(403).json({ error: "Unauthorized - Admin access required" });
    }

    if (req.method === "GET") {
      // Get all bounties in screening status
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
          submitterEmail: users.id, // We'll need to get email from Privy
          createdAt: innovationBounties.createdAt,
        })
        .from(innovationBounties)
        .leftJoin(users, eq(innovationBounties.submitterId, users.id))
        .where(eq(innovationBounties.status, "screening"))
        .orderBy(innovationBounties.createdAt);

      return res.status(200).json(screeningBounties);
    }

    else if (req.method === "POST") {
      // Approve or reject a bounty
      const { bountyId, action, screeningNotes, category } = req.body;

      if (!bountyId || !action) {
        return res.status(400).json({ error: "Bounty ID and action are required" });
      }

      if (action !== "approve" && action !== "reject" && action !== "request_changes") {
        return res.status(400).json({ error: "Invalid action" });
      }

      // Check if bounty exists and is in screening
      const bounty = await db
        .select()
        .from(innovationBounties)
        .where(eq(innovationBounties.id, bountyId))
        .limit(1);

      if (bounty.length === 0) {
        return res.status(404).json({ error: "Bounty not found" });
      }

      if (bounty[0]!.status !== "screening") {
        return res.status(400).json({ error: "Bounty is not in screening status" });
      }

      // Update bounty based on action
      const updates: any = {
        screeningNotes: screeningNotes || null,
        screenedBy: user!.id,
        screenedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      };

      if (action === "approve") {
        updates.status = "published";
        updates.publishedAt = sql`CURRENT_TIMESTAMP`;
        if (category) {
          updates.category = category;
        }
      } else if (action === "reject") {
        updates.status = "draft"; // Send back to draft with notes
      } else if (action === "request_changes") {
        updates.status = "draft"; // Send back to draft for changes
      }

      await db
        .update(innovationBounties)
        .set(updates)
        .where(eq(innovationBounties.id, bountyId));

      // Get updated bounty
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
  } catch (error: any) {
    console.error("Screening API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}