"use server";

import { requireAuth, requireAdmin, isUserAdmin } from "@/app/_lib/auth";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/app/_lib/action-utils";
import {
  db,
  innovationBounties,
  bountyProposals,
  bountyComments,
  users,
} from "@core/database";
import { eq, desc, and, sql, or, ilike } from "drizzle-orm";
import { generateId } from "@utils/id-generator";
import { revalidatePath } from "next/cache";
import { activitiesService } from "@services/activities";

// Field allowlists to prevent mass-assignment attacks
const SUBMITTER_FIELDS = [
  "title",
  "problemStatement",
  "useCase",
  "currentState",
  "commonToolsUsed",
  "desiredOutcome",
  "technicalRequirements",
  "constraints",
  "deliverables",
  "category",
  "bountyAmount",
  "bountyType",
  "deadline",
  "tags",
  "organizationType",
  "organizationName",
  "organizationContact",
  "organizationWebsite",
  "organizationSize",
  "organizationIndustry",
  "organizationAddress",
  "organizationCity",
  "organizationState",
  "organizationZip",
  "sponsorFirstName",
  "sponsorLastName",
  "sponsorEmail",
  "sponsorPhone",
  "sponsorTitle",
  "sponsorDepartment",
  "sponsorLinkedIn",
  "isAnonymous",
] as const;

const ADMIN_FIELDS = [...SUBMITTER_FIELDS, "status", "screeningNotes"] as const;

function sanitizeData(
  data: Record<string, any>,
  allowedFields: readonly string[],
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(data).filter(([k]) => allowedFields.includes(k)),
  );
}

// ============================================================================
// QUERIES (return data directly — auth failure triggers redirect)
// ============================================================================

export async function getBounties(filters?: {
  status?: string;
  category?: string;
  organizationType?: string;
  search?: string;
  includeAll?: boolean;
}) {
  const { user } = await requireAuth();
  const admin = filters?.includeAll ? await isUserAdmin(user.id) : false;

  let query = db
    .select({
      id: innovationBounties.id,
      title: innovationBounties.title,
      problemStatement: innovationBounties.problemStatement,
      useCase: innovationBounties.useCase,
      desiredOutcome: innovationBounties.desiredOutcome,
      category: innovationBounties.category,
      status: innovationBounties.status,
      bountyAmount: innovationBounties.bountyAmount,
      organizationType: innovationBounties.organizationType,
      organizationName: innovationBounties.organizationName,
      proposalCount: innovationBounties.proposalCount,
      viewCount: innovationBounties.viewCount,
      isAnonymous: innovationBounties.isAnonymous,
      createdAt: innovationBounties.createdAt,
      submitterId: innovationBounties.submitterId,
    })
    .from(innovationBounties)
    .$dynamic();

  const conditions = [];

  if (!admin || !filters?.includeAll) {
    conditions.push(eq(innovationBounties.status, "published"));
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(innovationBounties.status, filters.status));
  }
  if (filters?.category && filters.category !== "all") {
    conditions.push(eq(innovationBounties.category, filters.category));
  }
  if (filters?.organizationType && filters.organizationType !== "all") {
    conditions.push(
      eq(innovationBounties.organizationType, filters.organizationType),
    );
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(innovationBounties.title, `%${filters.search}%`),
        ilike(innovationBounties.problemStatement, `%${filters.search}%`),
      )!,
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(innovationBounties.createdAt));
}

export async function getMyBounties() {
  const { user } = await requireAuth();

  return db
    .select({
      id: innovationBounties.id,
      title: innovationBounties.title,
      problemStatement: innovationBounties.problemStatement,
      category: innovationBounties.category,
      status: innovationBounties.status,
      bountyAmount: innovationBounties.bountyAmount,
      proposalCount: innovationBounties.proposalCount,
      viewCount: innovationBounties.viewCount,
      createdAt: innovationBounties.createdAt,
    })
    .from(innovationBounties)
    .where(eq(innovationBounties.submitterId, user.id))
    .orderBy(desc(innovationBounties.createdAt));
}

export async function getBountyById(id: string) {
  const { user } = await requireAuth();
  const admin = await isUserAdmin(user.id);

  const bounty = await db
    .select()
    .from(innovationBounties)
    .where(eq(innovationBounties.id, id))
    .limit(1);

  if (!bounty[0]) return null;

  // Increment view count (non-blocking)
  db.update(innovationBounties)
    .set({ viewCount: sql`COALESCE(${innovationBounties.viewCount}, 0) + 1` })
    .where(eq(innovationBounties.id, id))
    .then(() => {});

  const [proposals, comments] = await Promise.all([
    db
      .select({
        id: bountyProposals.id,
        bountyId: bountyProposals.bountyId,
        projectId: bountyProposals.projectId,
        proposerId: bountyProposals.proposerId,
        proposerName: users.username,
        proposalTitle: bountyProposals.proposalTitle,
        proposalDescription: bountyProposals.proposalDescription,
        approach: bountyProposals.approach,
        timeline: bountyProposals.timeline,
        budget: bountyProposals.budget,
        teamMembers: bountyProposals.teamMembers,
        status: bountyProposals.status,
        reviewNotes: bountyProposals.reviewNotes,
        reviewedAt: bountyProposals.reviewedAt,
        createdAt: bountyProposals.createdAt,
      })
      .from(bountyProposals)
      .leftJoin(users, eq(bountyProposals.proposerId, users.id))
      .where(eq(bountyProposals.bountyId, id))
      .orderBy(desc(bountyProposals.createdAt)),
    db
      .select({
        id: bountyComments.id,
        bountyId: bountyComments.bountyId,
        authorId: bountyComments.authorId,
        authorName: users.username,
        content: bountyComments.content,
        parentId: bountyComments.parentId,
        isInternal: bountyComments.isInternal,
        createdAt: bountyComments.createdAt,
      })
      .from(bountyComments)
      .leftJoin(users, eq(bountyComments.authorId, users.id))
      .where(eq(bountyComments.bountyId, id))
      .orderBy(desc(bountyComments.createdAt)),
  ]);

  const isSubmitter = bounty[0].submitterId === user.id;
  const b = bounty[0];
  const userHasProposal = proposals.some((p) => p.proposerId === user.id);

  return {
    ...b,
    proposals,
    comments: comments.filter((c) => !c.isInternal || isSubmitter || admin),
    isSubmitter,
    isAdmin: admin,
    userHasProposal,
  };
}

export async function getScreeningBounties() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return [];

  return db
    .select({
      id: innovationBounties.id,
      title: innovationBounties.title,
      problemStatement: innovationBounties.problemStatement,
      category: innovationBounties.category,
      status: innovationBounties.status,
      organizationType: innovationBounties.organizationType,
      organizationName: innovationBounties.organizationName,
      submitterId: innovationBounties.submitterId,
      submitterName: users.username,
      createdAt: innovationBounties.createdAt,
    })
    .from(innovationBounties)
    .leftJoin(users, eq(innovationBounties.submitterId, users.id))
    .where(eq(innovationBounties.status, "screening"))
    .orderBy(desc(innovationBounties.createdAt));
}

export async function getProposals(bountyId: string) {
  await requireAuth();

  return db
    .select({
      id: bountyProposals.id,
      bountyId: bountyProposals.bountyId,
      proposerId: bountyProposals.proposerId,
      proposerName: users.username,
      proposalTitle: bountyProposals.proposalTitle,
      proposalDescription: bountyProposals.proposalDescription,
      approach: bountyProposals.approach,
      timeline: bountyProposals.timeline,
      budget: bountyProposals.budget,
      status: bountyProposals.status,
      createdAt: bountyProposals.createdAt,
    })
    .from(bountyProposals)
    .leftJoin(users, eq(bountyProposals.proposerId, users.id))
    .where(eq(bountyProposals.bountyId, bountyId))
    .orderBy(desc(bountyProposals.createdAt));
}

export async function getBountyComments(bountyId: string) {
  const { user } = await requireAuth();
  const admin = await isUserAdmin(user.id);

  const bounty = await db
    .select({ submitterId: innovationBounties.submitterId })
    .from(innovationBounties)
    .where(eq(innovationBounties.id, bountyId))
    .limit(1);

  const isSubmitter = bounty[0]?.submitterId === user.id;

  const comments = await db
    .select({
      id: bountyComments.id,
      bountyId: bountyComments.bountyId,
      authorId: bountyComments.authorId,
      authorName: users.username,
      content: bountyComments.content,
      parentId: bountyComments.parentId,
      isInternal: bountyComments.isInternal,
      createdAt: bountyComments.createdAt,
    })
    .from(bountyComments)
    .leftJoin(users, eq(bountyComments.authorId, users.id))
    .where(eq(bountyComments.bountyId, bountyId))
    .orderBy(desc(bountyComments.createdAt));

  return comments.filter((c) => !c.isInternal || isSubmitter || admin);
}

// ============================================================================
// MUTATIONS (return ActionResult<T> — never throw raw errors)
// ============================================================================

export async function createBounty(
  data: Record<string, any>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    const id = generateId();
    const now = new Date();

    await db.insert(innovationBounties).values({
      id,
      submitterId: user.id,
      title: data.title,
      problemStatement: data.problemStatement || "",
      useCase: data.useCase || "",
      desiredOutcome: data.desiredOutcome || "",
      currentState: data.currentState || null,
      commonToolsUsed: data.commonToolsUsed || null,
      technicalRequirements: data.technicalRequirements || null,
      constraints: data.constraints || null,
      deliverables: data.deliverables || null,
      category: data.category || "general",
      bountyAmount: data.bountyAmount ? Number(data.bountyAmount) : null,
      bountyType: data.bountyType || null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      tags: data.tags || null,
      organizationType: data.organizationType || "",
      organizationName: data.organizationName || "",
      organizationContact: data.organizationContact || null,
      organizationWebsite: data.organizationWebsite || null,
      organizationSize: data.organizationSize || null,
      organizationIndustry: data.organizationIndustry || null,
      organizationAddress: data.organizationAddress || null,
      organizationCity: data.organizationCity || null,
      organizationState: data.organizationState || null,
      organizationZip: data.organizationZip || null,
      sponsorFirstName: data.sponsorFirstName || null,
      sponsorLastName: data.sponsorLastName || null,
      sponsorEmail: data.sponsorEmail || null,
      sponsorPhone: data.sponsorPhone || null,
      sponsorTitle: data.sponsorTitle || null,
      sponsorDepartment: data.sponsorDepartment || null,
      sponsorLinkedIn: data.sponsorLinkedIn || null,
      isAnonymous: data.isAnonymous || false,
      status: "screening",
      createdAt: now,
      updatedAt: now,
    });

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "bounty_submitted", "bounty", id)
      .catch(() => {});

    revalidatePath("/bounties");
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateBounty(
  id: string,
  data: Record<string, any>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const bounty = await db
      .select({ submitterId: innovationBounties.submitterId })
      .from(innovationBounties)
      .where(eq(innovationBounties.id, id))
      .limit(1);

    if (!bounty[0]) return actionError(new Error("Bounty not found"));

    const admin = await isUserAdmin(user.id);
    if (bounty[0].submitterId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    // Apply field allowlist based on role to prevent mass-assignment
    const allowedFields = admin ? ADMIN_FIELDS : SUBMITTER_FIELDS;
    const safeData = sanitizeData(data, allowedFields);

    await db
      .update(innovationBounties)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(innovationBounties.id, id));

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${id}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteBounty(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const bounty = await db
      .select({ submitterId: innovationBounties.submitterId })
      .from(innovationBounties)
      .where(eq(innovationBounties.id, id))
      .limit(1);

    if (!bounty[0]) return actionError(new Error("Bounty not found"));

    const admin = await isUserAdmin(user.id);
    if (bounty[0].submitterId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    await db.delete(innovationBounties).where(eq(innovationBounties.id, id));
    revalidatePath("/bounties");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function screenBounty(
  id: string,
  action: "approve" | "reject" | "request_changes",
  notes?: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { isAdmin, user } = await requireAdmin();
    if (!isAdmin) return actionError(new Error("Not authorized"));

    const now = new Date();

    const statusMap: Record<string, string> = {
      approve: "published",
      reject: "rejected",
      request_changes: "draft",
    };

    await db
      .update(innovationBounties)
      .set({
        status: statusMap[action] ?? "draft",
        screeningNotes: notes || null,
        screenedBy: user.id,
        screenedAt: now,
        ...(action === "approve" ? { publishedAt: now } : {}),
        updatedAt: now,
      })
      .where(eq(innovationBounties.id, id));

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${id}`);
    revalidatePath("/admin/bounties");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function submitProposal(
  bountyId: string,
  data: {
    proposalTitle: string;
    proposalDescription: string;
    approach: string;
    timeline?: string;
    budget?: string;
    teamMembers?: any;
    projectId?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    // Check bounty exists and is published
    const bounty = await db
      .select({ status: innovationBounties.status })
      .from(innovationBounties)
      .where(eq(innovationBounties.id, bountyId))
      .limit(1);

    if (!bounty[0]) return actionError(new Error("Bounty not found"));
    if (bounty[0].status !== "published")
      return actionError(new Error("Bounty is not accepting proposals"));

    // Check user hasn't already submitted
    const existing = await db
      .select({ id: bountyProposals.id })
      .from(bountyProposals)
      .where(
        and(
          eq(bountyProposals.bountyId, bountyId),
          eq(bountyProposals.proposerId, user.id),
        ),
      )
      .limit(1);

    if (existing[0])
      return actionError(
        new Error("You have already submitted a proposal for this bounty"),
      );

    const id = generateId();
    const now = new Date();

    await db.insert(bountyProposals).values({
      id,
      bountyId,
      proposerId: user.id,
      projectId: data.projectId || null,
      proposalTitle: data.proposalTitle,
      proposalDescription: data.proposalDescription,
      approach: data.approach,
      timeline: data.timeline || null,
      budget: data.budget || null,
      teamMembers: data.teamMembers || null,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    });

    // Increment proposal count
    await db
      .update(innovationBounties)
      .set({
        proposalCount: sql`COALESCE(${innovationBounties.proposalCount}, 0) + 1`,
        updatedAt: now,
      })
      .where(eq(innovationBounties.id, bountyId));

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "bounty_proposal", "bounty", bountyId)
      .catch(() => {});

    revalidatePath(`/bounties/${bountyId}`);
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function reviewProposal(
  proposalId: string,
  decision: "accepted" | "rejected" | "revision_requested",
  notes?: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { isAdmin, user } = await requireAdmin();
    if (!isAdmin) return actionError(new Error("Not authorized"));

    const proposal = await db
      .select({ bountyId: bountyProposals.bountyId })
      .from(bountyProposals)
      .where(eq(bountyProposals.id, proposalId))
      .limit(1);

    if (!proposal[0]) return actionError(new Error("Proposal not found"));

    const now = new Date();

    await db
      .update(bountyProposals)
      .set({
        status: decision,
        reviewNotes: notes || null,
        reviewedBy: user.id,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(bountyProposals.id, proposalId));

    // If accepted, update bounty status to assigned
    if (decision === "accepted") {
      await db
        .update(innovationBounties)
        .set({ status: "assigned", updatedAt: now })
        .where(eq(innovationBounties.id, proposal[0].bountyId));
    }

    revalidatePath(`/bounties/${proposal[0].bountyId}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function addBountyComment(
  bountyId: string,
  content: string,
  parentId?: string,
  isInternal?: boolean,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    const bounty = await db
      .select({ id: innovationBounties.id })
      .from(innovationBounties)
      .where(eq(innovationBounties.id, bountyId))
      .limit(1);

    if (!bounty[0]) return actionError(new Error("Bounty not found"));

    // Only admins can post internal comments
    if (isInternal) {
      const admin = await isUserAdmin(user.id);
      if (!admin)
        return actionError(new Error("Only admins can post internal comments"));
    }

    const id = generateId();
    const now = new Date();

    await db.insert(bountyComments).values({
      id,
      bountyId,
      authorId: user.id,
      content,
      parentId: parentId || null,
      isInternal: isInternal || false,
      createdAt: now,
      updatedAt: now,
    });

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "comment_posted", "bounty", bountyId)
      .catch(() => {});

    revalidatePath(`/bounties/${bountyId}`);
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteBountyComment(
  commentId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const comment = await db
      .select({
        authorId: bountyComments.authorId,
        bountyId: bountyComments.bountyId,
      })
      .from(bountyComments)
      .where(eq(bountyComments.id, commentId))
      .limit(1);

    if (!comment[0]) return actionError(new Error("Comment not found"));

    const admin = await isUserAdmin(user.id);
    if (comment[0].authorId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    await db.delete(bountyComments).where(eq(bountyComments.id, commentId));
    revalidatePath(`/bounties/${comment[0].bountyId}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateBountyStatus(
  id: string,
  status: "assigned" | "completed" | "cancelled",
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { isAdmin } = await requireAdmin();
    if (!isAdmin) return actionError(new Error("Not authorized"));

    await db
      .update(innovationBounties)
      .set({ status, updatedAt: new Date() })
      .where(eq(innovationBounties.id, id));

    revalidatePath("/bounties");
    revalidatePath(`/bounties/${id}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}
