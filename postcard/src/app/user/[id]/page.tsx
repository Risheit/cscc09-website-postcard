"use client";

import AboutMe from '@/app/components/Account/AboutMe/AboutMe';
import DisplayName from '@/app/components/Account/DisplayName/DisplayName';
import ProfilePicture from '@/app/components/Account/ProfilePicture/ProfilePicture';
import useDbSession from '@/app/hooks/useDbSession';
import { User } from '@/backend/users';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page({ params }: { params: { id: string } }) {
  const session = useDbSession();
  const router = useRouter();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session.data?.dbUser?.id === params.id) {
      router.push("/account");
    }

    fetch(`/api/users/${params.id}`)
      .then(async (res) => {
        const user = await res.json();
        setUser(user);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log(err);
      });
  }, [session, params.id, router]);

  return (
    <div className="flex flex-auto">
      {!isLoading && (
        <div className="flex flex-auto p-10 gap-20">
          <ProfilePicture user={user} />
          <div className="flex flex-col w-full">
            <DisplayName user={user} />
            <p className="text-text-500">{`@${user?.id}`}</p>
            <AboutMe user={user} />
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center items-center h-full w-full">
          <img
            src="/static/loading.svg"
            alt="loading..."
            className="w-20 h-20 mt-20 opacity-50"
          />
        </div>
      )}
    </div>
  );
}
