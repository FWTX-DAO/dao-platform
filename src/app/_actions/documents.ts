'use server';

import { requireAuth } from '@/app/_lib/auth';
import { db, documents, users } from '@core/database';
import { eq, desc, and, ilike, or } from 'drizzle-orm';
import { generateId } from '@utils/id-generator';
import { revalidatePath } from 'next/cache';

export async function getDocuments(filters?: { search?: string; category?: string }) {
  await requireAuth();

  const conditions = [eq(documents.status, 'active')];
  if (filters?.search) {
    conditions.push(
      or(
        ilike(documents.name, `%${filters.search}%`),
        ilike(documents.description, `%${filters.search}%`)
      )!
    );
  }
  if (filters?.category) {
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
      author_name: users.username,
      uploaderId: documents.uploaderId,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .leftJoin(users, eq(documents.uploaderId, users.id))
    .where(and(...conditions))
    .orderBy(desc(documents.createdAt));
}

export async function createDocument(data: {
  name: string;
  description?: string;
  category?: string;
  pinataId?: string;
  cid?: string;
  mimeType?: string;
  fileSize?: number;
}) {
  const { user } = await requireAuth();

  const id = generateId();
  const now = new Date();

  await db.insert(documents).values({
    id,
    uploaderId: user.id,
    name: data.name,
    description: data.description || null,
    category: data.category || 'general',
    pinataId: data.pinataId || '',
    cid: data.cid || '',
    mimeType: data.mimeType || 'application/octet-stream',
    fileSize: data.fileSize || 0,
    status: 'active',
    isPublic: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath('/documents');
  return { id };
}

export async function updateDocument(id: string, data: Record<string, any>) {
  const { user } = await requireAuth();

  const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc[0]) throw new Error('Document not found');
  if (doc[0].uploaderId !== user.id) throw new Error('Not authorized');

  await db
    .update(documents)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(documents.id, id));

  revalidatePath('/documents');
  return { success: true };
}

export async function deleteDocument(id: string) {
  const { user } = await requireAuth();

  const doc = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!doc[0]) throw new Error('Document not found');
  if (doc[0].uploaderId !== user.id) throw new Error('Not authorized');

  await db
    .update(documents)
    .set({ status: 'deleted', updatedAt: new Date() })
    .where(eq(documents.id, id));

  revalidatePath('/documents');
  return { success: true };
}
