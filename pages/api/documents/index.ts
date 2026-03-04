import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError, NotFoundError, ForbiddenError } from "@core/errors/AppError";
import { dbOperations } from "@core/database/client";
import { pinata } from "@utils/pinata-config";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userId = req.user.id;

  if (req.method === "GET") {
    const { category, search, user_id } = req.query;

    let documents;

    if (search && typeof search === "string") {
      documents = await dbOperations.documents.searchDocuments(search);
    } else if (category && typeof category === "string") {
      documents = await dbOperations.documents.getDocumentsByCategory(category);
    } else if (user_id && typeof user_id === "string") {
      documents = await dbOperations.documents.getDocumentsByUser(user_id);
    } else {
      documents = await dbOperations.documents.getDocuments();
    }

    return res.status(200).json(documents);
  }

  if (req.method === "POST") {
    const { pinataId, cid, name, description, category, mimeType, fileSize, isPublic, tags } = req.body;

    if (!pinataId || !cid || !name || !mimeType || !fileSize) {
      throw new ValidationError("Missing required fields");
    }

    const document = await dbOperations.documents.createDocument({
      uploaderId: userId,
      name,
      description: description || "",
      category: category || "General",
      mimeType,
      fileSize,
      pinataId,
      cid,
      network: "private",
      keyvalues: {
        category: category || "General",
        uploadedBy: userId,
        description: description || "",
      },
      isPublic: !!isPublic,
      tags: tags || "",
    });

    return res.status(201).json(document);
  }

  if (req.method === "PUT") {
    const { id, name, description, category, tags, isPublic } = req.body;

    if (!id) {
      throw new ValidationError("Document ID is required");
    }

    const existingDoc = await dbOperations.documents.getDocumentById(id);
    if (!existingDoc) {
      throw new NotFoundError("Document");
    }

    if (existingDoc.document.uploaderId !== userId) {
      throw new ForbiddenError("You can only edit your own documents");
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (isPublic !== undefined) updates.isPublic = isPublic ? 1 : 0;

    // Run DB update and Pinata metadata update in parallel
    const updatePromises: Promise<unknown>[] = [
      dbOperations.documents.updateDocument(id, updates, userId),
    ];

    if (name || description || category) {
      updatePromises.push(
        pinata.files.private.update({
          id: existingDoc.document.pinataId,
          name: name || existingDoc.document.name,
          keyvalues: {
            category: category || existingDoc.document.category,
            uploadedBy: userId,
            description: description || existingDoc.document.description || "",
          },
        })
      );
    }

    await Promise.all(updatePromises);

    const updatedDoc = await dbOperations.documents.getDocumentById(id);
    return res.status(200).json(updatedDoc);
  }

  if (req.method === "DELETE") {
    const { id } = req.body;

    if (!id) {
      throw new ValidationError("Document ID is required");
    }

    const existingDoc = await dbOperations.documents.getDocumentById(id);
    if (!existingDoc) {
      throw new NotFoundError("Document");
    }

    if (existingDoc.document.uploaderId !== userId) {
      throw new ForbiddenError("You can only delete your own documents");
    }

    // Run DB delete and Pinata delete in parallel
    await Promise.all([
      dbOperations.documents.deleteDocument(id, userId),
      pinata.files.private.delete([existingDoc.document.pinataId]),
    ]);

    return res.status(200).json({ message: "Document deleted successfully" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default compose(errorHandler, withAuth)(handler);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
