import { signIn } from 'next-auth/react';
import { useRef } from 'react';

type OAuthSignUpProps = {
  defaultDisplayName: string;
  userId: number;
  redirectUrl: string;
};

export default function OAuthSignUp({
  defaultDisplayName,
  userId,
  redirectUrl,
}: OAuthSignUpProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!nameRef.current) {
      return;
    }

    const name = nameRef.current.value;
    fetch('/api/auth/oauth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: userId, displayName: name }),
    }).then(() => {
      signIn("github", { callbackUrl: redirectUrl });
    });
  };

  return (
    <div>
      <h1>OAuthSignUp</h1>
      <form onSubmit={handleSubmit}>
        <h2>Enter in a user name</h2>
        <input
          type="text"
          className="form-element"
          placeholder="Enter your name"
          defaultValue={defaultDisplayName}
          name="username"
          ref={nameRef}
          required
        />
        <button type="submit" className="form-element">
          Sign Up
        </button>
      </form>
    </div>
  );
}
