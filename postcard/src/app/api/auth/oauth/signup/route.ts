import { addUser, attachAccountToUser } from '@/backend/users';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { username, displayName } = await req.json();
  
  const user = await addUser(displayName);
  const account = await attachAccountToUser({ username, isOAuth: true, userId: user.id });
  return Response.json({ account });
}
