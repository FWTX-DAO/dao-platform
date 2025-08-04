import type { NextApiRequest, NextApiResponse } from 'next';
import { dbOperations } from '../../../src/db/client';
import { fetchAndVerifyAuthorization, createPrivyClient } from '../../../lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const client = createPrivyClient();
  const claims = await fetchAndVerifyAuthorization(req, res, client);
  if (!claims) return;

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Get or create user from Privy DID
        const user = await dbOperations.users.getByPrivyDid(claims.userId);
        
        if (!user) {
          // Create user if doesn't exist
          const email = (claims as any).email?.address || (claims as any).email || undefined;
          const newUser = await dbOperations.users.upsertFromPrivy(
            claims.userId,
            email
          );
          
          return res.status(200).json({
            user: newUser,
            membership: await dbOperations.members.getMembershipStatus(newUser!.id),
            isNew: true
          });
        }

        const membership = await dbOperations.members.getMembershipStatus(user!.id);
        
        return res.status(200).json({
          user,
          membership,
          isNew: false
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
      }

    case 'PUT':
      try {
        const { username, bio, avatarUrl } = req.body;
        
        // Get user
        const user = await dbOperations.users.getByPrivyDid(claims.userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Update profile
        await dbOperations.users.updateProfile(user!.id, {
          username,
          bio,
          avatarUrl
        });

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ error: 'Failed to update user' });
      }

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}