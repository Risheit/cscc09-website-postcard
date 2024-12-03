'use client';

import { useEffect, useState } from 'react';
import useDbSession from '@/app/hooks/useDbSession';
import { usePathname, useRouter } from 'next/navigation';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = useDbSession();
  const router = useRouter();
  const location = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session || session.status === 'unauthenticated') {
      router.push(`/account/create?redirect=${location}`);
    }
    if (session?.status === 'authenticated') {
      setIsLoading(false);
    }
  }, [session.data?.dbUser, router]);

  return (
    <>
      {!isLoading && children}
      {isLoading && (
        <div className="flex justify-center items-center h-full w-full">
          <img
            src="/static/loading.svg"
            alt="loading..."
            className="w-20 h-20 mt-20 opacity-50 select-none"
          />
        </div>
      )}
    </>
  );
}
