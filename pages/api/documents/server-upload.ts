import type { NextApiResponse } from "next";
import { compose, errorHandler, withAuth, type AuthenticatedRequest } from "@core/middleware";
import { ValidationError } from "@core/errors/AppError";
import { dbOperations } from "@core/database/client";
import { pinata } from "@utils/pinata-config";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = req.user.id;

  if (!process.env.PINATA_JWT) {
    return res.status(500).json({
      error: "Server configuration error: PINATA_JWT not configured"
    });
  }

  const { fileBase64, fileName, fileType, fileSize, name, description, category, tags, isPublic } = req.body;

  if (!fileBase64 || !fileName) {
    throw new ValidationError("Missing file data");
  }

  const fileBuffer = Buffer.from(fileBase64, 'base64');
  const fileBlob = new Blob([fileBuffer], { type: fileType || "application/octet-stream" });
  const uploadFile = new File([fileBlob], fileName, {
    type: fileType || "application/octet-stream"
  });

  const uploadResult = await pinata.upload.private.file(uploadFile)
    .name(name || fileName)
    .keyvalues({
      category: category || "General",
      description: description || "",
      uploadedBy: userId,
    });

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
    keyvalues: {
      category: category || "General",
      uploadedBy: userId,
      description: description || "",
    },
    isPublic: !!isPublic,
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
}

export default compose(errorHandler, withAuth)(handler);
