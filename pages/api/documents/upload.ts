import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateRequest } from "../../../lib/api-helpers";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate the request first
    await authenticateRequest(req);

    // Check if environment variables are set
    if (!process.env.PINATA_JWT) {
      console.error("PINATA_JWT environment variable is not set");
      return res.status(500).json({ 
        error: "Server configuration error: PINATA_JWT not configured" 
      });
    }

    // Import pinata dynamically to catch initialization errors
    const { pinata } = await import("../../../lib/pinata-config");
    
    // Create a signed upload URL that the client can use
    const url = await pinata.upload.private.createSignedURL({
      expires: 300, // 5 minutes
    });

    return res.status(200).json({ url });
  } catch (e: any) {
    console.error("Upload URL creation error:", e);
    
    // Provide more specific error messages
    if (e.message?.includes("Authentication Failed") || e.statusCode === 401) {
      return res.status(500).json({ 
        error: "Pinata authentication failed. Please check your PINATA_JWT configuration." 
      });
    }
    
    return res.status(500).json({ 
      error: "Internal Server Error",
      details: e.message || "Unknown error occurred"
    });
  }
}