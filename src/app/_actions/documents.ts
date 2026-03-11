"use server";

import { requireAuth, isUserAdmin } from "@/app/_lib/auth";
import {
  type ActionResult,
  actionSuccess,
  actionError,
} from "@/app/_lib/action-utils";
import {
  db,
  documents,
  documentAuditTrail,
  documentShares,
  users,
} from "@core/database";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { generateId } from "@utils/id-generator";
import { revalidatePath } from "next/cache";
import { activitiesService } from "@services/activities";
import { pinataHelpers } from "@utils/api-helpers";

// ============================================================================
// AUTHORIZATION HELPER
// ============================================================================

/** Check if a user can access a document (uploader, admin, active share, or public) */
async function canAccessDocument(
  documentId: string,
  userId: string,
  uploaderId: string | null,
  isPublic: boolean | null,
): Promise<boolean> {
  if (uploaderId === userId) return true;
  if (isPublic) return true;
  const admin = await isUserAdmin(userId);
  if (admin) return true;
  const share = await db
    .select({ id: documentShares.id })
    .from(documentShares)
    .where(
      and(
        eq(documentShares.documentId, documentId),
        eq(documentShares.sharedWithId, userId),
        eq(documentShares.isActive, true),
      ),
    )
    .limit(1);
  return share.length > 0;
}

// ============================================================================
// QUERIES (return data directly — auth failure triggers redirect)
// ============================================================================

export async function getDocuments(filters?: {
  search?: string;
  category?: string;
}) {
  await requireAuth();

  const conditions = [eq(documents.status, "active")];
  if (filters?.search) {
    conditions.push(
      or(
        ilike(documents.name, `%${filters.search}%`),
        ilike(documents.description, `%${filters.search}%`),
      )!,
    );
  }
  if (filters?.category && filters.category !== "all") {
    conditions.push(eq(documents.category, filters.category));
  }

  return db
    .select({
      id: documents.id,
      name: documents.name,
      description: documents.description,
      category: documents.category,
      mimeType: documents.mimeType,
      fileSize: documents.fileSize,
      isPublic: documents.isPublic,
      accessCount: documents.accessCount,
      author_name: users.username,
      uploaderId: documents.uploaderId,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .leftJoin(users, eq(documents.uploaderId, users.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: string) {
  const { user } = await requireAuth();

  const doc = await db
    .select({
      id: documents.id,
      name: documents.name,
      description: documents.description,
      category: documents.category,
      mimeType: documents.mimeType,
      fileSize: documents.fileSize,
      pinataId: documents.pinataId,
      cid: documents.cid,
      isPublic: documents.isPublic,
      tags: documents.tags,
      accessCount: documents.accessCount,
      lastAccessedAt: documents.lastAccessedAt,
      uploaderId: documents.uploaderId,
      uploaderName: users.username,
      status: documents.status,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .leftJoin(users, eq(documents.uploaderId, users.id))
    .where(eq(documents.id, id))
    .limit(1);

  if (!doc[0] || doc[0].status !== "active") return null;

  // Authorization: check user can access this document
  const hasAccess = await canAccessDocument(id, user.id, doc[0].uploaderId, doc[0].isPublic);
  if (!hasAccess) return null;

  // Increment access count and log audit trail (non-blocking)
  const now = new Date();
  Promise.all([
    db
      .update(documents)
      .set({
        accessCount: sql`COALESCE(${documents.accessCount}, 0) + 1`,
        lastAccessedAt: now,
      })
      .where(eq(documents.id, id)),
    db.insert(documentAuditTrail).values({
      id: generateId(),
      documentId: id,
      userId: user.id,
      action: "accessed",
      timestamp: now,
    }),
  ]).catch(() => {});

  const isUploader = doc[0].uploaderId === user.id;
  const admin = await isUserAdmin(user.id);

  return {
    ...doc[0],
    isUploader,
    isAdmin: admin,
  };
}

export async function getDocumentAuditTrail(documentId: string) {
  const { user } = await requireAuth();

  // Authorization: verify access to this document
  const doc = await db
    .select({ uploaderId: documents.uploaderId, isPublic: documents.isPublic })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!doc[0]) return [];
  const hasAccess = await canAccessDocument(documentId, user.id, doc[0].uploaderId, doc[0].isPublic);
  if (!hasAccess) return [];

  return db
    .select({
      id: documentAuditTrail.id,
      action: documentAuditTrail.action,
      metadata: documentAuditTrail.metadata,
      timestamp: documentAuditTrail.timestamp,
      userName: users.username,
      userId: documentAuditTrail.userId,
    })
    .from(documentAuditTrail)
    .leftJoin(users, eq(documentAuditTrail.userId, users.id))
    .where(eq(documentAuditTrail.documentId, documentId))
    .orderBy(desc(documentAuditTrail.timestamp));
}

export async function getDocumentShares(documentId: string) {
  const { user } = await requireAuth();

  // Authorization: only uploader or admin can see shares
  const doc = await db
    .select({ uploaderId: documents.uploaderId })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!doc[0]) return [];
  if (doc[0].uploaderId !== user.id) {
    const admin = await isUserAdmin(user.id);
    if (!admin) return [];
  }

  return db
    .select({
      id: documentShares.id,
      shareType: documentShares.shareType,
      isActive: documentShares.isActive,
      expiresAt: documentShares.expiresAt,
      createdAt: documentShares.createdAt,
      sharedByName: users.username,
      sharedById: documentShares.sharedById,
      sharedWithId: documentShares.sharedWithId,
    })
    .from(documentShares)
    .leftJoin(users, eq(documentShares.sharedById, users.id))
    .where(
      and(
        eq(documentShares.documentId, documentId),
        eq(documentShares.isActive, true),
      ),
    )
    .orderBy(desc(documentShares.createdAt));
}

// ============================================================================
// MUTATIONS (return ActionResult<T> — never throw raw errors)
// ============================================================================

export async function createDocument(data: {
  name: string;
  description?: string;
  category?: string;
  pinataId?: string;
  cid?: string;
  mimeType?: string;
  fileSize?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    const id = generateId();
    const now = new Date();

    await db.insert(documents).values({
      id,
      uploaderId: user.id,
      name: data.name,
      description: data.description || null,
      category: data.category || "General",
      pinataId: data.pinataId || "",
      cid: data.cid || "",
      mimeType: data.mimeType || "application/octet-stream",
      fileSize: data.fileSize || 0,
      status: "active",
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    });

    // Audit trail entry
    await db.insert(documentAuditTrail).values({
      id: generateId(),
      documentId: id,
      userId: user.id,
      action: "created",
      timestamp: now,
    });

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "document_uploaded", "document", id)
      .catch(() => {});

    revalidatePath("/documents");
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function updateDocument(
  id: string,
  data: Record<string, any>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const doc = await db
      .select({ uploaderId: documents.uploaderId })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!doc[0]) return actionError(new Error("Document not found"));

    const admin = await isUserAdmin(user.id);
    if (doc[0].uploaderId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    const allowedFields = [
      "name",
      "description",
      "category",
      "tags",
      "isPublic",
    ];
    const safeData = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowedFields.includes(k)),
    );

    await db
      .update(documents)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(documents.id, id));

    // Audit trail entry
    await db.insert(documentAuditTrail).values({
      id: generateId(),
      documentId: id,
      userId: user.id,
      action: "updated",
      metadata: { updatedFields: Object.keys(safeData) },
      timestamp: new Date(),
    });

    revalidatePath("/documents");
    revalidatePath(`/documents/${id}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteDocument(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const doc = await db
      .select({ uploaderId: documents.uploaderId })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!doc[0]) return actionError(new Error("Document not found"));

    const admin = await isUserAdmin(user.id);
    if (doc[0].uploaderId !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    await db
      .update(documents)
      .set({ status: "deleted", updatedAt: new Date() })
      .where(eq(documents.id, id));

    // Audit trail entry
    await db.insert(documentAuditTrail).values({
      id: generateId(),
      documentId: id,
      userId: user.id,
      action: "deleted",
      timestamp: new Date(),
    });

    revalidatePath("/documents");
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function shareDocument(
  documentId: string,
  sharedWithId: string,
  shareType: string = "view",
): Promise<ActionResult<{ id: string }>> {
  try {
    const { user } = await requireAuth();

    const doc = await db
      .select({ uploaderId: documents.uploaderId })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!doc[0]) return actionError(new Error("Document not found"));

    const admin = await isUserAdmin(user.id);
    if (doc[0].uploaderId !== user.id && !admin) {
      return actionError(new Error("Not authorized to share this document"));
    }

    const id = generateId();
    const now = new Date();

    await db.insert(documentShares).values({
      id,
      documentId,
      sharedById: user.id,
      sharedWithId,
      shareType,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Audit trail entry
    await db.insert(documentAuditTrail).values({
      id: generateId(),
      documentId,
      userId: user.id,
      action: "shared",
      metadata: { sharedWithId, shareType },
      timestamp: now,
    });

    // Track activity (non-blocking)
    activitiesService
      .trackActivity(user.id, "document_shared", "document", documentId)
      .catch(() => {});

    revalidatePath(`/documents/${documentId}`);
    return actionSuccess({ id });
  } catch (err) {
    return actionError(err);
  }
}

export async function revokeShare(
  shareId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { user } = await requireAuth();

    const share = await db
      .select({
        sharedById: documentShares.sharedById,
        documentId: documentShares.documentId,
      })
      .from(documentShares)
      .where(eq(documentShares.id, shareId))
      .limit(1);

    if (!share[0]) return actionError(new Error("Share not found"));

    const admin = await isUserAdmin(user.id);
    if (share[0].sharedById !== user.id && !admin) {
      return actionError(new Error("Not authorized"));
    }

    await db
      .update(documentShares)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(documentShares.id, shareId));

    // Audit trail entry
    await db.insert(documentAuditTrail).values({
      id: generateId(),
      documentId: share[0].documentId,
      userId: user.id,
      action: "share_revoked",
      metadata: { shareId },
      timestamp: new Date(),
    });

    revalidatePath(`/documents/${share[0].documentId}`);
    return actionSuccess({ success: true });
  } catch (err) {
    return actionError(err);
  }
}

export async function getDownloadUrl(
  documentId: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    const { user } = await requireAuth();

    const doc = await db
      .select({
        cid: documents.cid,
        name: documents.name,
        uploaderId: documents.uploaderId,
        isPublic: documents.isPublic,
      })
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.status, "active")))
      .limit(1);

    if (!doc[0]) return actionError(new Error("Document not found"));

    // Authorization: verify access to this document
    const hasAccess = await canAccessDocument(documentId, user.id, doc[0].uploaderId, doc[0].isPublic);
    if (!hasAccess) return actionError(new Error("Not authorized"));

    const downloadLink = await pinataHelpers.createDownloadLink(doc[0].cid, {
      expires: 3600,
    });

    // Audit trail entry (non-blocking)
    db.insert(documentAuditTrail)
      .values({
        id: generateId(),
        documentId,
        userId: user.id,
        action: "downloaded",
        timestamp: new Date(),
      })
      .catch(() => {});

    return actionSuccess({
      url: (downloadLink as any).url || String(downloadLink),
    });
  } catch (err) {
    return actionError(err);
  }
}
