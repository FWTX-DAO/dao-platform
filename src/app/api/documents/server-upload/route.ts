import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { getOrCreateUser } from '@core/database/queries/users';
import { pinataHelpers } from '@shared/utils/api-helpers';
import { db, documents } from '@core/database';
import { generateId } from '@utils/id-generator';

let _privy: PrivyClient | null = null;
function getPrivy() {
  if (!_privy) _privy = new PrivyClient(process.env.NEXT_PUBLIC_PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);
  return _privy;
}

export async function POST(request: Request) {
  const privy = getPrivy();
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });
  }

  const authToken = authHeader.replace(/^Bearer /, '');
  let claims;
  try {
    claims = await privy.verifyAuthToken(authToken);
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  const user = await getOrCreateUser(claims.userId, (claims as any).email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await request.json();
  const { fileBase64, fileName, fileType, fileSize, name, description, category, tags, isPublic } = body;

  if (!fileBase64 || !fileName) {
    return NextResponse.json({ error: 'fileBase64 and fileName are required' }, { status: 400 });
  }

  try {
    // Convert base64 back to a File object for Pinata
    const buffer = Buffer.from(fileBase64, 'base64');
    const blob = new Blob([buffer], { type: fileType || 'application/octet-stream' });
    const file = new File([blob], fileName, { type: fileType || 'application/octet-stream' });

    // Upload to Pinata
    const uploadResult = await pinataHelpers.uploadFile(file, {
      name: name || fileName,
      network: 'private',
    });

    // Create document record in database
    const id = generateId();
    const now = new Date();

    await db.insert(documents).values({
      id,
      uploaderId: user.id,
      name: name || fileName,
      description: description || null,
      category: category || 'General',
      mimeType: fileType || 'application/octet-stream',
      fileSize: fileSize || buffer.length,
      pinataId: uploadResult.id,
      cid: uploadResult.cid,
      network: 'private',
      status: 'active',
      isPublic: isPublic || false,
      tags: tags || null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      cid: uploadResult.cid,
      name: name || fileName,
      size: fileSize || buffer.length,
      mimeType: fileType,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
