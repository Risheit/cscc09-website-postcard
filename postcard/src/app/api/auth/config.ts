import GithubProvider from 'next-auth/providers/github';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { getServerSession, NextAuthOptions, Session } from 'next-auth';
import {
  Account,
  getAccountByUsername,
  getUserById,
  User,
} from '@/backend/users';

// See: https://next-auth.js.org/configuration/nextjs#getserversession
export function authorizeSession(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}

export interface DBSession extends Session {
  account?: Account;
}

export const config = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === 'github') {
        const connectedAccount = await getAccountByUsername(user.id);
        if (!connectedAccount) {
          const encodedName = encodeURIComponent(user.name ?? '');
          return `/account/oauth/create?name=${encodedName}&user=${user.id}`;
        }
      }

      return true;
    },

    session: async ({ session, token }) => {
      if (token?.sub === undefined) {
        return session;
      }

      const account = await getAccountByUsername(token.sub);
      return { ...session, account } as DBSession;
    },
  },
} as NextAuthOptions;
