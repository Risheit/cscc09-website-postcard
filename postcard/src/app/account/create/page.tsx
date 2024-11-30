'use client';

import CredentialsSignUp from '@/app/components/CredentialsSignUp/CredentialsSignUp';
import OAuthSignUp from '@/app/components/OAuthSignUp/OAuthSignUp';
import { signIn } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const testWhitespace = /\s/g;

function withQueryParams(url: string, params: { [key: string]: string }) {
  const searchParams = new URLSearchParams(params).toString();
  return `${url}?${searchParams}`;
}

function getErrorMessage(error: string) {
  switch (error) {
    case 'missing_user':
      return 'Unable to connect this account with an OAuth provider. Please retry the sign in process.';
    case 'account_exists':
      return 'An account with this username already exists. Please use a different username.';
    case 'malformed_fields':
      return "There's an issue with the username or password. Username and password fields may not have any spaces.";
    default:
      return 'An error occurred when creating this account. Please try again later.';
  }
}

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const router = useRouter();
  const path = usePathname();

  const userId = searchParams?.user;
  const provider = searchParams?.provider;
  const isOAuth = provider !== undefined;
  const imagePath = searchParams?.image;
  const defaultDisplayName =
    searchParams?.name?.replace(testWhitespace, '') ?? '';
  const redirectUrl = searchParams?.redirect ?? '/';
  const returnUrl = searchParams?.return ?? '/api/auth/signin';
  const signUpMessage = isOAuth ? 'complete sign up' : 'create account';
  const error = searchParams?.error;

  const [oAuthFormData, setOAuthFormData] = useState({
    name: defaultDisplayName,
  });

  const [credentialsFormData, setCredentialsFormData] = useState({
    username: '',
    password: '',
  });

  const [isRequesting, setIsRequesting] = useState(false);
  const [isFormInvalid, setIsFormInvalid] = useState(false);

  const handleFetch = async () => {
    const data = isOAuth
      ? JSON.stringify({
          username: userId,
          displayName: oAuthFormData.name,
          profilePicture: imagePath,
        })
      : JSON.stringify({
          username: credentialsFormData.username,
          displayName: credentialsFormData.username,
          credentials: credentialsFormData.password,
        });

    if (isOAuth) {
      return fetch('/api/auth/signup/oauth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });
    } else {
      return fetch('/api/auth/signup/credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data,
      });
    }
  };

  const handleSubmit = async () => {
    setIsRequesting(true);
    if (isOAuth && !userId) {
      router.replace(
        withQueryParams(path, { ...searchParams, error: 'missing_user' })
      );
    }

    const response = await handleFetch();
    if (response.status == 409) {
      router.replace(
        withQueryParams(path, { ...searchParams, error: 'account_exists' })
      );
      setIsRequesting(false);
      return;
    }

    if (response.status == 400) {
      router.replace(
        withQueryParams(path, { ...searchParams, error: 'malformed_fields' })
      );
      setIsRequesting(false);
      return;
    }

    if (response.status != 200) {
      router.replace(
        withQueryParams(path, {
          ...searchParams,
          error: 'generic',
        })
      );
      setIsRequesting(false);
      return;
    }

    if (isOAuth) {
      await signIn(provider, { callbackUrl: redirectUrl });
    } else {
      await signIn('credentials', {
        username: credentialsFormData.username,
        password: credentialsFormData.password,
        callbackUrl: redirectUrl,
      });
    }

    setIsRequesting(false);
  };

  return (
    <div
      id="oauth-sign-up-page"
      className="flex flex-col gap-2 mt-4 w-full max-w-[800px] px-4"
    >
      <h1 className="text-2xl font-bold">Sign Up</h1>

      <p className="text-text-500">
        {isOAuth ? 'Finish setting up your account' : 'Create a new account'}
      </p>

      {error && (
        <div className="p-4 bg-red-700 border border-red-700 rounded">
          {getErrorMessage(error)}
        </div>
      )}

      {isOAuth && (
        <OAuthSignUp
          defaultName={defaultDisplayName}
          formData={oAuthFormData}
          setFormData={setOAuthFormData}
          setFormInvalid={setIsFormInvalid}
        />
      )}

      {!isOAuth && (
        <CredentialsSignUp
          formData={credentialsFormData}
          setFormData={setCredentialsFormData}
          setFormInvalid={setIsFormInvalid}
        />
      )}

      <div className="grid grid-cols-2 gap-2 mb-12">
        <button
          className="p-2 bg-background-200 rounded flex-none disabled:bg-background-100 disabled:border-background-300 disabled:border"
          onClick={() => router.push(returnUrl)}
        >
          back
        </button>
        <button
          className="p-2 bg-primary-500 rounded flex-none disabled:bg-background-100 disabled:border-background-300 disabled:border"
          disabled={isRequesting || isFormInvalid}
          onClick={() => handleSubmit()}
        >
          {isRequesting ? 'signing up...' : signUpMessage}
        </button>
      </div>
    </div>
  );
}
