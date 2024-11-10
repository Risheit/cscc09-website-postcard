import pool from '@/backend/cloudsql';

export type User = {
  id: number;
  displayName: string;
  profilePicturePath: string | undefined;
};

export type Account = {
  username: string;
  credentials?: string | undefined;
  isOAuth: boolean;
  userId: number;
};

function fromRawUser(userRaw?: {
  id: number;
  display_name: string;
  profile_pic: string;
}) {
  return userRaw ? {
    id: userRaw?.id,
    displayName: userRaw?.display_name,
    profilePicturePath: userRaw?.profile_pic,
  } as User : undefined;
}

function fromRawAccount(accountRaw?: {
  username: string;
  credentials: string | undefined;
  is_oauth: boolean;
  user_id: number;
}) {
  return accountRaw ? {
    username: accountRaw?.username,
    credentials: accountRaw?.credentials,
    isOAuth: accountRaw?.is_oauth,
    userId: accountRaw?.user_id,
  } as Account : undefined;
}

export async function getUserByUsername(username: string) {
  const userRaw = await pool.query(
    'SELECT * FROM users JOIN accounts ON user_id = id WHERE username = $1::text LIMIT 1',
    [username]
  );

  const user = userRaw.rows[0];
  return fromRawUser(user);
}

export async function getUserById(id: number) {
  const userRaw = await pool.query(
    'SELECT * FROM users JOIN accounts ON user_id = id WHERE id = $1::integer LIMIT 1',
    [id]
  );

  const user = userRaw.rows[0];
  return fromRawUser(user);
}

export async function addUser(displayName: string) {
  const userRaw = await pool.query(
    'INSERT INTO users (display_name, profile_pic) VALUES ($1::text, $2::text) RETURNING *',
    [displayName, '']
  );

  const user = userRaw.rows[0];
  return fromRawUser(user)!;
}

export async function attachAccountToUser(account: Account) {
  const { username, credentials, isOAuth, userId } = account;
  await pool.query(
    `INSERT INTO accounts (username, credentials, is_oauth, user_id) 
     VALUES($1:: text, $2:: text, $3:: boolean, $4:: integer)
    `,
    [username, credentials, isOAuth, userId]
  );
  return account;
}

export async function getAccountByUsername(username: string) {
  const accountRaw = await pool.query(
    'SELECT * FROM accounts WHERE username = $1::text LIMIT 1',
    [username]
  );

  const account = accountRaw.rows[0];
  return fromRawAccount(account);
}