import { addUser, attachAccountToUser, getAccountByUsername } from '@/backend/users';
import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';

const saltRounds = 10;
const testWhitespace = /\s/gm;

export async function PUT(req: NextRequest) {
  const { username, displayName, credentials } = await req.json();

  if (!credentials || !username || !displayName) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (testWhitespace.test(username) || testWhitespace.test(credentials)) {
    return Response.json({ error: 'Username and password cannot contain whitespace' }, { status: 400 });
  }

  const existingAccount = await getAccountByUsername(username);
  if (existingAccount) {
    return Response.json({ error: 'account already exists' }, { status: 409 });
  }

  const user = await addUser(username, displayName);
  if (!user) {
    return Response.json({ error: 'Username already exists' }, { status: 409 });
  }

  const encrypted = await bcrypt.hash(credentials, saltRounds);
  const account = await attachAccountToUser({
    username,
    credentials: encrypted,
    isOAuth: false,
    userId: user.id,
  });
  return Response.json({ account });
}
