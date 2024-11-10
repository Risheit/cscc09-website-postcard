import GithubProvider from 'next-auth/providers/github';
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import { getServerSession, NextAuthOptions } from 'next-auth';
import { signIn } from 'next-auth/react';
import {
  addUser,
  attachAccountToUser,
  getAccountByUsername,
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
export const config = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile, email, credentials }) => {
      if (account?.provider === 'github') {
        const connectedAccount = await getAccountByUsername(user.id);
        console.log('connectedAccount', connectedAccount);
        if (!connectedAccount) {
          const encodedName = encodeURIComponent(user.name ?? '');
          return `/account/oauth/create?name=${encodedName}&user=${user.id}`;
        }

        return true;
      }

      return true;
    },

    session: async ({ session, token, user }) => {
      return session;
    },
  },
} as NextAuthOptions;
