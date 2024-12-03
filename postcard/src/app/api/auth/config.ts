import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import {
  getServerSession,
  NextAuthOptions,
  User as NextUser,
} from 'next-auth';
import {
  getCredentialsAccountByUsername,
  getOAuthAccountByUsername,
  getUserById,
  getUserByUsername,
} from '@/backend/users';
import bcrypt from 'bcrypt';
import DbSession from '@/app/models/DbSession';

// See: https://next-auth.js.org/configuration/nextjs#getserversession
export function authorizeSession(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}

export const config = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const account = await getCredentialsAccountByUsername(
          credentials.username
        );
        if (!account) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          account.credentials
        );
        if (!isValidPassword) {
          return null;
        }

        const user = await getUserById(account.userId);
        if (!user) {
          return null;
        }

        const nextUser: NextUser = {
          id: user.id.toString(),
          name: user.displayName,
          image: user.profilePicturePath,
        };

        return nextUser;
      },
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === 'github') {
        const connectedAccount = await getOAuthAccountByUsername(user.id);
        if (!connectedAccount) {
          const encodedName = encodeURIComponent(user.name ?? '');
          const redirectUrl = `/account/create?provider=github&name=${encodedName}&user=${user.id}`;
          return !user.image
            ? redirectUrl
            : redirectUrl + `&image=${user.image}`;
        }
      }
      return true;
    },

    session: async ({ session, token }) => {
      if (token?.sub === undefined) {
        return session;
      }

      const dbUser = await getUserByUsername(token.sub);
      return { ...session, dbUser } as DbSession;
    },
  },
} as NextAuthOptions;
