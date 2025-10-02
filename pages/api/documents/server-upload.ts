import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "@utils/api-helpers";
import { getUserIdFromClaims } from "@utils/db-helpers";
import { dbOperations } from "@core/database/client";
import { pinata } from "@utils/pinata-config";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate the request
    const claims = await authenticateRequest(req);
    const userId = await getUserIdFromClaims(claims);

    // Check if environment variables are set
    if (!process.env.PINATA_JWT) {
      console.error("PINATA_JWT environment variable is not set");
      return res.status(500).json({ 
        error: "Server configuration error: PINATA_JWT not configured" 
      });
    }

    const { fileBase64, fileName, fileType, fileSize, name, description, category, tags, isPublic } = req.body;

    if (!fileBase64 || !fileName) {
      return res.status(400).json({ error: "Missing file data" });
    }

    // Convert base64 to Buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');
    
    // Create a Blob and File object for Pinata
    const fileBlob = new Blob([fileBuffer], { type: fileType || "application/octet-stream" });
    const uploadFile = new File([fileBlob], fileName, { 
      type: fileType || "application/octet-stream" 
    });

    // Upload to Pinata
    const uploadResult = await pinata.upload.private.file(uploadFile)
      .name(name || fileName)
      .keyvalues({
        category: category || "General",
        description: description || "",
        uploadedBy: userId,
      });

    // Save to database
    const document = await dbOperations.documents.createDocument({
      uploaderId: userId,
      name: name || fileName,
      description: description || "",
      category: category || "General",
      mimeType: fileType || "application/octet-stream",
      fileSize: fileSize || fileBuffer.length,
      pinataId: uploadResult.id,
      cid: uploadResult.cid,
      network: "private",
      keyvalues: JSON.stringify({
        category: category || "General",
        uploadedBy: userId,
        description: description || "",
      }),
      isPublic: isPublic ? 1 : 0,
      tags: tags || "",
    });

    return res.status(201).json({
      document,
      pinataData: {
        id: uploadResult.id,
        cid: uploadResult.cid,
        name: uploadResult.name,
        size: uploadResult.size,
        mimeType: uploadResult.mime_type,
      }
    });

  } catch (e: any) {
    console.error("Server upload error:", e);
    
    // Provide more specific error messages
    if (e.message?.includes("Authentication Failed") || e.statusCode === 401) {
      return res.status(500).json({ 
        error: "Pinata authentication failed. Please check your PINATA_JWT configuration." 
      });
    }

    if (e.message?.includes("PINATA_JWT")) {
      return res.status(500).json({ 
        error: "Server configuration error: PINATA_JWT not configured" 
      });
    }
    
    return res.status(500).json({ 
      error: "Internal Server Error",
      details: e.message || "Unknown error occurred"
    });
  }
}