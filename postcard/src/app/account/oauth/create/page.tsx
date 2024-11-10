'use client';

import OAuthSignUp from '@/app/components/OAuthSignUp/OAuthSignUp';
import { useEffect } from 'react';

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const defaultDisplayName = (searchParams?.name as string) ?? '';
  const userId = (searchParams?.user as string) ?? '';

  useEffect(() => {
    if (searchParams?.user === undefined) {
      throw new Error('userId is required.');
    }
  });

  return (
    <OAuthSignUp
      defaultDisplayName={defaultDisplayName}
      userId={parseInt(userId)}
      redirectUrl="/"
    />
  );
}
