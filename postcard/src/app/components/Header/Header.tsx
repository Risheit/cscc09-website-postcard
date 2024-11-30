"use client";
import Link from "next/link";
import { faMapLocationDot, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import useDbSession from "@/app/hooks/useDbSession";
import Image from "next/image";


export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useDbSession();

  useEffect(() => {
    // if not logged in then redirect to /api/auth/signin
    // if (
    //   !session.data?.dbUser &&
    //   pathname !== "/" &&
    //   pathname !== "/api/auth/signin"
    // ) {
    //   router.push("/api/auth/signin");
    // }

    if (pathname === "/" && session.data?.dbUser) {
      router.replace("/dashboard");
    }
  });

  return (
    <header className="h-12 flex relative place-items-center justify-between border-b border-background-300 shadow-md shadow-background-100 p-2">
      {/* click route to /dashboard or / */}
      <Link href="/" className="h-full flex place-items-center">
        <span className="aspect-square h-full flex items-center justify-center rounded-full bg-primary-500 ml-2">
          <FontAwesomeIcon icon={faMapLocationDot} className="text-white" />
        </span>
        <span className="pl-2">postcard.</span>
      </Link>

      {/* if route is not /post/create, show create post button */}
      {session.data?.dbUser && (
        <button
          className="absolute bg-primary-400 hover:bg-primary-500 px-4 inline"
          style={{ left: '50%', transform: 'translateX(-50%)' }} // perfectly centered :)
          onClick={() => {
            router.push('/post/create');
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className="pl-2">create post</span>
        </button>
      )}

      {/* if not logged in */}
      {!session.data?.dbUser && (
        <span className="flex gap-2 place-items-center pr-2">
          <button
            className="bg-primary-300 px-4"
            onClick={() => {
              router.push('/account/create?return=/');
            }}
          >
            sign up
          </button>
          <button
            className="bg-secondary-100 px-4 border-background-300"
            onClick={() => {
              router.push('/api/auth/signin');
            }}
          >
            log in
          </button>
        </span>
      )}

      {/* if logged in, click route to /account */}
      {session.data?.dbUser && (
        <span className="flex gap-4 place-items-center pr-2">
          <Link href="/account" className="h-full flex place-items-center">
            <span className="aspect-square h-full flex items-center justify-center rounded-full overflow-hidden">
              {session.data?.dbUser?.profilePicturePath ? (
                <Image
                  src={session.data?.dbUser?.profilePicturePath}
                  alt="profile"
                  className="rounded-full w-6"
                />
              ) : (
                <span className="rounded-full h-6 w-6 bg-text-900"></span>
              )}
            </span>
            <span className="pl-2">Hello, {session.data?.dbUser?.displayName}</span>
          </Link>
          <button
            className="bg-secondary-100 px-4 border-background-300"
            onClick={() => {
              router.push('/api/auth/signout');
            }}
          >
            log out
          </button>
        </span>
      )}
    </header>
  );
}
