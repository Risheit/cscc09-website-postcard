'use client';

import useDbSession from '@/app/hooks/useDbSession';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DisplayName from '../components/Account/DisplayName/DisplayName';
import AboutMe from '../components/Account/AboutMe/AboutMe';
import ProfilePicture from '../components/Account/ProfilePicture/ProfilePicture';

export default function Page() {
  const session = useDbSession();
  const [user, setUser] = useState(session.data?.dbUser);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('session', session);
    if (!session || session.status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
    if (session?.status === 'authenticated') {
      setIsLoading(false);
    }
    setUser(session.data?.dbUser);
  }, [session.data?.dbUser, router]);

  const handleAccountEdit = (data: {
    displayName?: string;
    aboutMe?: string;
    profilePicture?: File;
  }) => {
    const formData = new FormData();
    if (data.displayName) {
      formData.append('displayName', data.displayName);
    }
    if (data.aboutMe) {
      formData.append('aboutMe', data.aboutMe);
    }
    if (data.profilePicture) {
      formData.append(
        'profilePic',
        data.profilePicture,
        `${user?.id ?? ''}_data.profilePicture.name)`
      );
    }

    setIsLoading(true);

    fetch(`/api/users/${user?.id}`, {
      method: 'PATCH',
      body: formData,
    })
      .then(async (res) => {
        const u = await res.json();
        console.log('updated user', u);
        const updatedUser = {
          aboutMe: u.about_me,
          displayName: u.display_name,
          id: u.id,
          profilePicturePath: `/api/images/${u.profile_pic}`,
          externalProfilePic: u.external_profile_pic,
        };
        setUser(updatedUser);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="flex flex-auto">
      {!isLoading && (
        <div className="flex flex-auto p-10 gap-20">
          <ProfilePicture user={user} onEdit={handleAccountEdit} />
          <div className="flex flex-col w-full">
            <DisplayName user={user} onEdit={handleAccountEdit} />
            <p className="text-text-500">{`@${user?.id}`}</p>
            <AboutMe user={user} onEdit={handleAccountEdit} />
          </div>
        </div>
      )}
      {isLoading && (
        <div className="flex justify-center items-center h-full w-full">
          <img
            src="/static/loading.svg"
            alt="loading..."
            className="w-20 h-20 mt-20 opacity-50 select-none"
          />
        </div>
      )}
    </div>
  );
}
