import type { NextApiRequest, NextApiResponse } from "next";
import { initializeDatabase } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // In production, you should add authentication to protect this endpoint
  // For now, we'll check for a simple secret
  const { secret } = req.body;
  if (secret !== process.env.DB_INIT_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await initializeDatabase();
    return res.status(200).json({ message: "Database initialized successfully" });
  } catch (error) {
    console.error("Database initialization error:", error);
    return res.status(500).json({ error: "Failed to initialize database" });
  }
}