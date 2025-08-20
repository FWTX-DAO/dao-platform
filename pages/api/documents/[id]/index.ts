import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../../lib/api-helpers";
import { getUserIdFromClaims } from "../../../../lib/db-helpers";
import { dbOperations } from "../../../../src/db/client";
import { pinata } from "../../../../lib/pinata-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const claims = await authenticateRequest(req);
    const userId = await getUserIdFromClaims(claims);
    const { id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid document ID" });
    }

    if (req.method === "GET") {
      const document = await dbOperations.documents.getDocumentById(id);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Create download link for private files
      let downloadUrl = null;
      if (document.document.network === "private") {
        try {
          downloadUrl = await pinata.gateways.private.createAccessLink({
            cid: document.document.cid,
            expires: 3600, // 1 hour
          });
        } catch (error) {
          console.warn("Could not create download link:", error);
        }
      } else {
        downloadUrl = await pinata.gateways.public.convert(document.document.cid);
      }

      return res.status(200).json({
        ...document,
        downloadUrl,
      });
    }

    if (req.method === "PUT") {
      const { name, description, category, tags, isPublic } = req.body;

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
      try {
        await pinata.files.private.delete([existingDoc.document.pinataId]);
      } catch (error) {
        console.warn("Could not delete from Pinata:", error);
        // Continue with soft delete even if Pinata deletion fails
      }

      return res.status(200).json({ message: "Document deleted successfully" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Document API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}