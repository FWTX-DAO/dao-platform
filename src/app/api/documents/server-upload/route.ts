import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { getOrCreateUser } from "@core/database/queries/users";
import { pinataHelpers } from "@shared/utils/api-helpers";
import { db, documents } from "@core/database";
import { generateId } from "@utils/id-generator";

let _privy: PrivyClient | null = null;
function getPrivy() {
  if (!_privy)
    _privy = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      process.env.PRIVY_APP_SECRET!,
    );
  return _privy;
}

export async function POST(request: Request) {
  const privy = getPrivy();
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  const authToken = authHeader.replace(/^Bearer /, "");
  let claims;
  try {
    claims = await privy.verifyAuthToken(authToken);
  } catch {
    return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
  }

  const user = await getOrCreateUser(claims.userId, (claims as any).email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Parse FormData — binary upload, no base64 overhead
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "A file is required" },
      { status: 400 },
    );
  }

  try {
    // Upload directly to Pinata — no base64 conversion needed
    const uploadResult = await pinataHelpers.uploadFile(file, {
      name: file.name,
      network: "private",
    });

    // Create document record — all metadata inferred from the file
    const id = generateId();
    const now = new Date();

    await db.insert(documents).values({
      id,
      uploaderId: user.id,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      pinataId: uploadResult.id,
      cid: uploadResult.cid,
      network: "private",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      cid: uploadResult.cid,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
