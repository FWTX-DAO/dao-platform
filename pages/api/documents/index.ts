import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { getUserIdFromClaims } from "@utils/db-helpers";
import { dbOperations } from "@core/database/client";
import { pinata } from "@utils/pinata-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const userId = await getUserIdFromClaims(claims);

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
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Save to database
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
        keyvalues: JSON.stringify({
          category: category || "General",
          uploadedBy: userId,
          description: description || "",
        }),
        isPublic: isPublic ? 1 : 0,
        tags: tags || "",
      });

      return res.status(201).json(document);
    }

    if (req.method === "PUT") {
      const { id, name, description, category, tags, isPublic } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Document ID is required" });
      }

      // Check if document exists and user owns it
      const existingDoc = await dbOperations.documents.getDocumentById(id);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (existingDoc.document.uploaderId !== userId) {
        return res.status(403).json({ error: "You can only edit your own documents" });
      }

      // Update document
      const updates: any = {};
      if (name) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (category) updates.category = category;
      if (tags !== undefined) updates.tags = tags;
      if (isPublic !== undefined) updates.isPublic = isPublic ? 1 : 0;

      await dbOperations.documents.updateDocument(id, updates, userId);

      // Update Pinata metadata if needed
      if (name || description || category) {
        await pinata.files.private.update({
          id: existingDoc.document.pinataId,
          name: name || existingDoc.document.name,
          keyvalues: {
            category: category || existingDoc.document.category,
            uploadedBy: userId,
            description: description || existingDoc.document.description || "",
          },
        });
      }

      const updatedDoc = await dbOperations.documents.getDocumentById(id);
      return res.status(200).json(updatedDoc);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Document ID is required" });
      }

      // Check if document exists and user owns it
      const existingDoc = await dbOperations.documents.getDocumentById(id);
      if (!existingDoc) {
        return res.status(404).json({ error: "Document not found" });
      }

      if (existingDoc.document.uploaderId !== userId) {
        return res.status(403).json({ error: "You can only delete your own documents" });
      }

      // Soft delete in database
      await dbOperations.documents.deleteDocument(id, userId);

      // Delete from Pinata
      await pinata.files.private.delete([existingDoc.document.pinataId]);

      return res.status(200).json({ message: "Document deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Documents API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}