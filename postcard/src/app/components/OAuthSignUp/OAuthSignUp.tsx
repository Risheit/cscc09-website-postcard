"use client";

import { Dispatch, useEffect, useRef } from "react";

export default function OAuthSignUp(props: {
  defaultName: string;
  formData: {
    name: string;
  };
  setFormData: Dispatch<{
    name: string;
  }>;
  setFormInvalid: Dispatch<boolean>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    defaultName,
    formData,
    setFormData,
    setFormInvalid: setFormInvalid,
  } = props;

  useEffect(() => {
    if (!inputRef.current?.value) {
      setFormInvalid(true);
    }
  }, [setFormInvalid]);

  return (
    <div id="oauth-sign-up-form" className="grid grid-cols-1 gap-4 mb-4">
      <label className="flex flex-col">
        <span className="font-semibold mb-1">Username:</span>
        <input
          type="text"
          className="p-2 bg-background-50 border border-text-500 rounded"
          placeholder="Enter a username..."
          defaultValue={defaultName}
          name="displayName"
          ref={inputRef}
          onChange={(ev) => {
            setFormData({ ...formData, name: ev.target.value });
            setFormInvalid(!ev.target.value);
          }}
          maxLength={30}
          required
        />
      </label>
    </div>
  );
}
