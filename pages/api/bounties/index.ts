import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest, generateId } from "../../../lib/api-helpers";
import { getOrCreateUser } from "../../../src/db/queries/users";
import { db, innovationBounties, users } from "../../../src/db";
import { eq, sql, and, or, like } from "drizzle-orm";

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

    if (req.method === "GET") {
      // Get query parameters for filtering
      const { status, category, organizationType, search } = req.query;

      // Build filter conditions
      const conditions = [];
      
      // Only show published bounties to non-admins (for now, everyone sees all)
      if (!req.query.includeAll) {
        conditions.push(eq(innovationBounties.status, "published"));
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

      // Get bounties with submitter info
      const bounties = await db
        .select({
          id: innovationBounties.id,
          title: innovationBounties.title,
          organizationName: innovationBounties.organizationName,
          organizationType: innovationBounties.organizationType,
          organizationWebsite: innovationBounties.organizationWebsite,
          problemStatement: innovationBounties.problemStatement,
          useCase: innovationBounties.useCase,
          currentState: innovationBounties.currentState,
          desiredOutcome: innovationBounties.desiredOutcome,
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
        .orderBy(sql`${innovationBounties.createdAt} DESC`);

      // Filter out submitter info if anonymous
      const sanitizedBounties = bounties.map(bounty => ({
        ...bounty,
        submitterName: bounty.isAnonymous ? "Anonymous" : bounty.submitterName,
        submitterAvatar: bounty.isAnonymous ? null : bounty.submitterAvatar,
        submitterId: bounty.isAnonymous ? null : bounty.submitterId,
      }));

      return res.status(200).json(sanitizedBounties);
    }

    else if (req.method === "POST") {
      // Create new bounty
      const {
        organizationName,
        organizationType,
        organizationIndustry,
        organizationCity,
        organizationState,
        organizationContact,
        organizationWebsite,
        sponsorFirstName,
        sponsorLastName,
        sponsorEmail,
        sponsorPhone,
        sponsorTitle,
        title,
        problemStatement,
        useCase,
        currentState,
        commonToolsUsed,
        desiredOutcome,
        technicalRequirements,
        constraints,
        deliverables,
        bountyAmount,
        bountyType,
        deadline,
        category,
        tags,
        isAnonymous,
      } = req.body;

      // Validate required fields
      if (!organizationName || !organizationType || !title || !problemStatement || 
          !useCase || !desiredOutcome) {
        return res.status(400).json({
          error: "Missing required fields: organizationName, organizationType, title, problemStatement, useCase, desiredOutcome"
        });
      }

      const bountyId = generateId();
      
      // Auto-publish all bounties (no screening phase)
      const status = "published";
      const publishedAt = sql`CURRENT_TIMESTAMP`;

      const newBounty = await db.insert(innovationBounties).values({
        id: bountyId,
        organizationName,
        organizationType,
        organizationIndustry: organizationIndustry || null,
        organizationCity: organizationCity || null,
        organizationState: organizationState || null,
        organizationContact,
        organizationWebsite,
        sponsorFirstName: sponsorFirstName || null,
        sponsorLastName: sponsorLastName || null,
        sponsorEmail: sponsorEmail || null,
        sponsorPhone: sponsorPhone || null,
        sponsorTitle: sponsorTitle || null,
        title,
        problemStatement,
        useCase,
        currentState,
        commonToolsUsed: Array.isArray(commonToolsUsed) ? commonToolsUsed.join(",") : commonToolsUsed,
        desiredOutcome,
        technicalRequirements: Array.isArray(technicalRequirements) ? JSON.stringify(technicalRequirements) : technicalRequirements,
        constraints,
        deliverables,
        bountyAmount: bountyAmount ? Math.round(bountyAmount * 100) : null, // Convert to cents
        bountyType: bountyType || "fixed",
        deadline,
        category,
        tags: Array.isArray(tags) ? tags.join(",") : tags,
        status,
        publishedAt,
        submitterId: user!.id,
        isAnonymous: isAnonymous ? 1 : 0,
      }).returning();

      return res.status(201).json({
        ...newBounty[0],
        submitterName: isAnonymous ? "Anonymous" : user!.username,
        submitterAvatar: isAnonymous ? null : user!.avatarUrl,
      });
    }

    else if (req.method === "PUT") {
      // Update bounty
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Bounty ID is required" });
      }

      // Check if bounty exists and user has permission
      const existingBounty = await db
        .select()
        .from(innovationBounties)
        .where(eq(innovationBounties.id, id))
        .limit(1);

      if (existingBounty.length === 0) {
        return res.status(404).json({ error: "Bounty not found" });
      }

      // Only allow submitter to edit their own bounty
      if (existingBounty[0]!.submitterId !== user!.id) {
        return res.status(403).json({ error: "You can only edit your own bounties" });
      }

      // Allow editing any bounty by its owner except completed ones
      if (existingBounty[0]!.status === "completed") {
        return res.status(403).json({ error: "Cannot edit completed bounties" });
      }

      // Process updates
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
      
      // Handle status change for submitting for review
      if (updates.submitForReview && existingBounty[0]!.status === "draft") {
        processedUpdates.status = "screening";
      }
      
      processedUpdates.updatedAt = sql`CURRENT_TIMESTAMP`;

      await db
        .update(innovationBounties)
        .set(processedUpdates)
        .where(eq(innovationBounties.id, id));

      // Get updated bounty
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

    else if (req.method === "DELETE") {
      // Delete bounty
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Bounty ID is required" });
      }

      // Check if bounty exists and user has permission
      const existingBounty = await db
        .select()
        .from(innovationBounties)
        .where(eq(innovationBounties.id, id))
        .limit(1);

      if (existingBounty.length === 0) {
        return res.status(404).json({ error: "Bounty not found" });
      }

      if (existingBounty[0]!.submitterId !== user!.id) {
        return res.status(403).json({ error: "You can only delete your own bounties" });
      }

      // Allow deleting bounties that haven't been completed or assigned
      if (existingBounty[0]!.status === "completed" || existingBounty[0]!.status === "assigned") {
        return res.status(403).json({ error: "Cannot delete bounties that are assigned or completed" });
      }

      await db.delete(innovationBounties).where(eq(innovationBounties.id, id));

      return res.status(200).json({ message: "Bounty deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Bounties API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}