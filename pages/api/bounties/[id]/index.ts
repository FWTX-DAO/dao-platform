import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../../lib/api-helpers";
import { getOrCreateUser } from "../../../../src/db/queries/users";
import { db, innovationBounties, users, bountyProposals, bountyComments } from "../../../../src/db";
import { eq, sql, and } from "drizzle-orm";

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
    
    const { id } = req.query;
    
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Bounty ID is required" });
    }

    if (req.method === "GET") {
      // Get bounty details with all related information
      const bountyResult = await db
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
          screenedBy: innovationBounties.screenedBy,
          screenedAt: innovationBounties.screenedAt,
          publishedAt: innovationBounties.publishedAt,
          viewCount: innovationBounties.viewCount,
          proposalCount: innovationBounties.proposalCount,
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

      if (bountyResult.length === 0) {
        return res.status(404).json({ error: "Bounty not found" });
      }

      const bounty = bountyResult[0]!;
      
      // Only show non-published bounties to their submitters
      if (bounty.status !== "published" && bounty.status !== "assigned" && bounty.status !== "completed") {
        if (bounty.submitterId !== user?.id) {
          return res.status(404).json({ error: "Bounty not found" });
        }
      }

      // Increment view count for published bounties (not for the submitter)
      if (bounty.status === "published" && bounty.submitterId !== user?.id) {
        await db
          .update(innovationBounties)
          .set({ viewCount: sql`${innovationBounties.viewCount} + 1` })
          .where(eq(innovationBounties.id, id));
      }

      // Get proposals count
      const proposalsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(bountyProposals)
        .where(eq(bountyProposals.bountyId, id));

      // Get comments (only non-internal or internal if user is submitter/admin)
      const commentsConditions = [eq(bountyComments.bountyId, id)];
      
      // For now, show all comments. In production, you'd check for admin role
      if (bounty.submitterId !== user?.id) {
        commentsConditions.push(eq(bountyComments.isInternal, 0));
      }

      const comments = await db
        .select({
          id: bountyComments.id,
          content: bountyComments.content,
          isInternal: bountyComments.isInternal,
          authorId: bountyComments.authorId,
          authorName: users.username,
          authorAvatar: users.avatarUrl,
          parentId: bountyComments.parentId,
          createdAt: bountyComments.createdAt,
        })
        .from(bountyComments)
        .leftJoin(users, eq(bountyComments.authorId, users.id))
        .where(and(...commentsConditions))
        .orderBy(bountyComments.createdAt);

      // Check if user has submitted a proposal
      let userProposal = null;
      if (user) {
        const userProposalResult = await db
          .select()
          .from(bountyProposals)
          .where(
            and(
              eq(bountyProposals.bountyId, id),
              eq(bountyProposals.proposerId, user.id)
            )
          )
          .limit(1);
        
        if (userProposalResult.length > 0) {
          userProposal = userProposalResult[0];
        }
      }

      // Sanitize response based on anonymity
      const sanitizedBounty = {
        ...bounty,
        submitterName: bounty.isAnonymous ? "Anonymous" : bounty.submitterName,
        submitterAvatar: bounty.isAnonymous ? null : bounty.submitterAvatar,
        submitterId: bounty.isAnonymous ? null : bounty.submitterId,
        // Don't show contact info unless it's the submitter or the bounty is published
        organizationContact: (bounty.submitterId === user?.id || bounty.status === "published") 
          ? bounty.organizationContact 
          : null,
        // Don't show screening notes unless it's the submitter or admin
        screeningNotes: bounty.submitterId === user?.id ? bounty.screeningNotes : null,
        proposalCount: proposalsCount[0]?.count || 0,
        comments,
        userHasProposal: !!userProposal,
        userIsSubmitter: bounty.submitterId === user?.id,
      };

      return res.status(200).json(sanitizedBounty);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Bounty detail API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}