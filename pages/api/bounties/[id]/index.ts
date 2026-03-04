import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { getOrCreateUser } from "@core/database/queries/users";
import { db, innovationBounties, users, bountyProposals, bountyComments, members } from "@core/database";
import { eq, sql, and } from "drizzle-orm";

/**
 * Check if user has admin privileges (council member or screener role)
 */
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

      // Check if user has admin privileges for elevated access
      const isAdmin = user ? await isUserAdmin(user.id) : false;
      const isSubmitter = bounty.submitterId === user?.id;

      // Show non-published bounties only to their submitters OR verified admins
      // Note: includeAll query param now requires verified admin status
      const requestsAdminAccess = req.query.includeAll === 'true';
      if (bounty.status !== "published" && bounty.status !== "assigned" && bounty.status !== "completed") {
        const hasAccess = isSubmitter || (requestsAdminAccess && isAdmin);
        if (!hasAccess) {
          return res.status(404).json({ error: "Bounty not found" });
        }
      }

      // Build comments conditions - internal comments only visible to submitter or admin
      const commentsConditions = [eq(bountyComments.bountyId, id)];
      if (!isSubmitter && !isAdmin) {
        commentsConditions.push(eq(bountyComments.isInternal, false));
      }

      // Parallelize independent queries for better performance
      const [proposalsCountResult, comments, userProposalResult, _viewCountUpdate] = await Promise.all([
        // Get proposals count
        db.select({ count: sql<number>`count(*)` })
          .from(bountyProposals)
          .where(eq(bountyProposals.bountyId, id)),

        // Get comments
        db.select({
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
          .orderBy(bountyComments.createdAt),

        // Check if user has submitted a proposal
        user
          ? db.select()
              .from(bountyProposals)
              .where(and(
                eq(bountyProposals.bountyId, id),
                eq(bountyProposals.proposerId, user.id)
              ))
              .limit(1)
          : Promise.resolve([]),

        // Increment view count (non-blocking, runs in parallel)
        bounty.status === "published" && bounty.submitterId !== user?.id
          ? db.update(innovationBounties)
              .set({ viewCount: sql`${innovationBounties.viewCount} + 1` })
              .where(eq(innovationBounties.id, id))
          : Promise.resolve(null),
      ]);

      const proposalsCount = proposalsCountResult;
      const userProposal = userProposalResult.length > 0 ? userProposalResult[0] : null;

      // Sanitize response based on anonymity and access level
      const sanitizedBounty = {
        ...bounty,
        submitterName: bounty.isAnonymous ? "Anonymous" : bounty.submitterName,
        submitterAvatar: bounty.isAnonymous ? null : bounty.submitterAvatar,
        submitterId: bounty.isAnonymous ? null : bounty.submitterId,
        // Show contact info to submitter, admins, or for published bounties
        organizationContact: (isSubmitter || isAdmin || bounty.status === "published")
          ? bounty.organizationContact
          : null,
        // Show screening notes only to submitter or verified admin
        screeningNotes: (isSubmitter || isAdmin) ? bounty.screeningNotes : null,
        proposalCount: proposalsCount[0]?.count || 0,
        comments,
        userHasProposal: !!userProposal,
        userIsSubmitter: isSubmitter,
        userIsAdmin: isAdmin,
      };

      return res.status(200).json(sanitizedBounty);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Bounty detail API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}