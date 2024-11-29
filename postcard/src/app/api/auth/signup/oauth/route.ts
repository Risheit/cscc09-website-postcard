import {
  addUser,
  attachAccountToUser,
  getAccountByUsername,
  getUserById,
} from '@/backend/users';
import { NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
  const { username, displayName, profilePicture } = await req.json();

  if (!username || !displayName) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const existingAccount = await getAccountByUsername(username);
  if (existingAccount) {
    return Response.json({ error: 'account already exists' }, { status: 409 });
  }

  let user = await addUser(displayName, displayName, profilePicture);
  if (!user) {
    return Response.json({ error: 'Username already exists' }, { status: 409 });
  }

  const account = await attachAccountToUser({
    username,
    isOAuth: true,
    userId: user.id,
  });
  return Response.json({ account });
}
