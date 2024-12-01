"use client";

import { Dispatch, useEffect, useRef } from "react";

export default function OAuthSignUp(props: {
  formData: {
    username: string;
    password: string;
  };
  setFormData: Dispatch<{
    username: string;
    password: string;
  }>;
  setFormInvalid: Dispatch<boolean>;
}) {
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { formData, setFormData, setFormInvalid } = props;

  useEffect(() => {
    const isValid = usernameRef.current?.value && passwordRef.current?.value;
    setFormInvalid(!isValid);
  }, [formData, setFormInvalid]);

  return (
    <div id="oauth-sign-up-form" className="grid grid-cols-1 gap-4 mb-4">
      <label className="flex flex-col">
        <span className="font-semibold mb-1">Username:</span>
        <input
          type="text"
          className="p-2 bg-background-50 border border-text-500 rounded"
          placeholder="Enter a username..."
          ref={usernameRef}
          name="username"
          onChange={(ev) =>
            setFormData({ ...formData, username: ev.target.value })
          }
          required
        />
      </label>

      <label className="flex flex-col">
        <span className="font-semibold mb-1">Password:</span>
        <input
          type="password"
          className="p-2 bg-background-50 border border-text-500 rounded"
          placeholder="Enter a password..."
          ref={passwordRef}
          name="password"
          onChange={(ev) =>
            setFormData({ ...formData, password: ev.target.value })
          }
          required
        />
      </label>
    </div>
  );
}
