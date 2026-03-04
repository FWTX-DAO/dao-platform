'use server';

import { requireAuth } from '@/app/_lib/auth';
import {
  db,
  innovationBounties,
  bountyProposals,
  bountyComments,
  members,
  memberRoles,
  roles,
} from '@core/database';
import { eq, desc, and, sql, or, ilike } from 'drizzle-orm';
import { generateId } from '@utils/id-generator';
import { revalidatePath } from 'next/cache';

async function isUserAdmin(userId: string) {
  const adminRoles = await db
    .select()
    .from(memberRoles)
    .innerJoin(members, eq(memberRoles.memberId, members.id))
    .innerJoin(roles, eq(memberRoles.roleId, roles.id))
    .where(
      and(
        eq(members.userId, userId),
        or(eq(roles.name, 'council_member'), eq(roles.name, 'screener'), eq(roles.name, 'admin'))
      )
    )
    .limit(1);
  return adminRoles.length > 0;
}

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
    conditions.push(eq(innovationBounties.status, 'published'));
  }
  if (filters?.status && filters.status !== 'all') {
    conditions.push(eq(innovationBounties.status, filters.status));
  }
  if (filters?.category) {
    conditions.push(eq(innovationBounties.category, filters.category));
  }
  if (filters?.organizationType) {
    conditions.push(eq(innovationBounties.organizationType, filters.organizationType));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(innovationBounties.title, `%${filters.search}%`),
        ilike(innovationBounties.problemStatement, `%${filters.search}%`)
      )!
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(innovationBounties.createdAt));
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
    db.select().from(bountyProposals).where(eq(bountyProposals.bountyId, id)),
    db.select().from(bountyComments).where(eq(bountyComments.bountyId, id)).orderBy(desc(bountyComments.createdAt)),
  ]);

  const isSubmitter = bounty[0].submitterId === user.id;
  const b = bounty[0];

  return {
    ...b,
    proposals,
    comments: comments.filter((c: any) => !c.isInternal || isSubmitter || admin),
    isSubmitter,
    isAdmin: admin,
  };
}

export async function createBounty(data: Record<string, any>) {
  const { user } = await requireAuth();

  const id = generateId();
  const now = new Date();

  await db.insert(innovationBounties).values({
    id,
    submitterId: user.id,
    title: data.title,
    problemStatement: data.problemStatement || '',
    useCase: data.useCase || '',
    desiredOutcome: data.desiredOutcome || '',
    currentState: data.currentState || null,
    commonToolsUsed: data.commonToolsUsed || null,
    technicalRequirements: data.technicalRequirements || null,
    constraints: data.constraints || null,
    deliverables: data.deliverables || null,
    category: data.category || 'general',
    bountyAmount: data.bountyAmount ? Number(data.bountyAmount) : null,
    bountyType: data.bountyType || null,
    deadline: data.deadline ? new Date(data.deadline) : null,
    tags: data.tags || null,
    organizationType: data.organizationType || '',
    organizationName: data.organizationName || '',
    organizationContact: data.organizationContact || null,
    organizationWebsite: data.organizationWebsite || null,
    sponsorFirstName: data.sponsorFirstName || null,
    sponsorLastName: data.sponsorLastName || null,
    sponsorEmail: data.sponsorEmail || null,
    sponsorPhone: data.sponsorPhone || null,
    sponsorTitle: data.sponsorTitle || null,
    isAnonymous: data.isAnonymous || false,
    status: 'screening',
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath('/bounties');
  return { id };
}

export async function updateBounty(id: string, data: Record<string, any>) {
  const { user } = await requireAuth();

  const bounty = await db
    .select()
    .from(innovationBounties)
    .where(eq(innovationBounties.id, id))
    .limit(1);

  if (!bounty[0]) throw new Error('Bounty not found');

  const isAdmin = await isUserAdmin(user.id);
  if (bounty[0].submitterId !== user.id && !isAdmin) {
    throw new Error('Not authorized');
  }

  await db
    .update(innovationBounties)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(innovationBounties.id, id));

  revalidatePath('/bounties');
  revalidatePath(`/bounties/${id}`);
  return { success: true };
}

export async function deleteBounty(id: string) {
  const { user } = await requireAuth();

  const bounty = await db
    .select()
    .from(innovationBounties)
    .where(eq(innovationBounties.id, id))
    .limit(1);

  if (!bounty[0]) throw new Error('Bounty not found');
  if (bounty[0].submitterId !== user.id) throw new Error('Not authorized');

  await db.delete(innovationBounties).where(eq(innovationBounties.id, id));
  revalidatePath('/bounties');
  return { success: true };
}

export async function getScreeningBounties() {
  const { user } = await requireAuth();
  const admin = await isUserAdmin(user.id);
  if (!admin) throw new Error('Not authorized');

  return db
    .select()
    .from(innovationBounties)
    .where(eq(innovationBounties.status, 'screening'))
    .orderBy(desc(innovationBounties.createdAt));
}

export async function screenBounty(id: string, action: 'approve' | 'reject' | 'request_changes', notes?: string) {
  const { user } = await requireAuth();
  const admin = await isUserAdmin(user.id);
  if (!admin) throw new Error('Not authorized');

  const now = new Date();
  const newStatus = action === 'approve' ? 'published' : 'draft';

  await db
    .update(innovationBounties)
    .set({
      status: newStatus,
      screeningNotes: notes || null,
      screenedBy: user.id,
      screenedAt: now,
      ...(action === 'approve' ? { publishedAt: now } : {}),
      updatedAt: now,
    })
    .where(eq(innovationBounties.id, id));

  revalidatePath('/bounties');
  return { success: true };
}
