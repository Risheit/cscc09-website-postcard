import pool from '@/backend/cloudsql';

export type User = {
  id: string;
  displayName: string;
  aboutMe: string;
  externalProfilePic: boolean;
  profilePicturePath?: string;
};

export type CredentialsAccount = {
  username: string;
  credentials: string;
  isOAuth: false;
  userId: string;
};

export type OAuthAccount = {
  username: string;
  credentials?: string;
  isOAuth: true;
  userId: string;
};

export type Account = CredentialsAccount | OAuthAccount;

function fromRawUser(userRaw?: {
  id: string;
  display_name: string;
  profile_pic: string;
  external_profile_pic: boolean;
  about_me: string;
}) {
  const internalProfilePicPath =
    userRaw?.profile_pic.trim() !== ''
      ? `/api/images/${userRaw?.profile_pic}`
      : undefined;

  console.log('internalProfilePicPath', internalProfilePicPath);
  return userRaw
    ? ({
        id: userRaw.id,
        displayName: userRaw.display_name,
        aboutMe: userRaw.about_me,
        externalProfilePic: userRaw.external_profile_pic,
        profilePicturePath: userRaw?.external_profile_pic
          ? userRaw.profile_pic
          : internalProfilePicPath,
      } as User)
    : undefined;
}

function fromRawAccount(accountRaw?: {
  username: string;
  credentials?: string;
  is_oauth: boolean;
  user_id: string;
}) {
  return accountRaw
    ? ({
        username: accountRaw.username,
        credentials: accountRaw.credentials,
        isOAuth: accountRaw.is_oauth,
        userId: accountRaw.user_id,
      } as Account)
    : undefined;
}

export async function getUserByUsername(username: string) {
  const userRaw = await pool.query(
    'SELECT * FROM users JOIN accounts ON user_id = id WHERE username = $1::text LIMIT 1',
    [username]
  );

  const user = userRaw.rows[0];
  return fromRawUser(user);
}

export async function getUserById(id: string) {
  const userRaw = await pool.query(
    'SELECT * FROM users JOIN accounts ON user_id = id WHERE id = $1::text LIMIT 1',
    [id]
  );

  const user = userRaw.rows[0];
  return fromRawUser(user);
}

export async function addUser(
  id: string,
  displayName: string,
  profilePic?: string,
  profilePicSource: 'external' | 'internal' = 'internal'
) {
  const userRaw = await pool.query(
    `INSERT INTO users (id, display_name, profile_pic, external_profile_pic)
     VALUES ($1::text, $2::text, $3::text, $4::boolean)
     ON CONFLICT DO NOTHING
     RETURNING *
    `,
    [id, displayName, profilePic ?? '', profilePicSource === 'external']
  );

  const user = userRaw.rows[0];
  return fromRawUser(user);
}

export async function attachAccountToUser(account: Account) {
  console.log('attaching account to user', account);
  const { username, credentials, isOAuth, userId } = account;
  console.log('here');
  const created = await pool.query(
    `INSERT INTO accounts (username, credentials, is_oauth, user_id) 
     VALUES($1::text, $2::text, $3::boolean, $4::text)
     ON CONFLICT DO NOTHING
     RETURNING *
    `,
    [username, credentials, isOAuth, userId]
  );
  console.log('done');
  return fromRawAccount(created.rows[0]);
}

export async function getAccountByUsername(username: string) {
  const accountRaw = await pool.query(
    'SELECT * FROM accounts WHERE username = $1::text LIMIT 1',
    [username]
  );

  const account = accountRaw.rows[0];
  return fromRawAccount(account);
}

export async function getOAuthAccountByUsername(username: string) {
  const accountRaw = await pool.query(
    'SELECT * FROM accounts WHERE username = $1::text AND is_oauth = true LIMIT 1',
    [username]
  );

  const account = accountRaw.rows[0];
  return fromRawAccount(account) as OAuthAccount;
}

export async function getCredentialsAccountByUsername(username: string) {
  const accountRaw = await pool.query(
    'SELECT * FROM accounts WHERE username = $1::text AND is_oauth = false LIMIT 1',
    [username]
  );

  const account = accountRaw.rows[0];
  return fromRawAccount(account) as CredentialsAccount;
}
