"use client";
import Link from "next/link";
import {
  faMapLocationDot,
  faPlus,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();

  return (
    <header className="h-12 flex relative place-items-center justify-between border-b border-background-300 shadow-md shadow-background-100 p-2">
      {/* click route to /dashboard or / */}
      <Link href="/" className="h-full flex place-items-center">
        <span className="aspect-square h-full flex items-center justify-center rounded-full bg-primary-500 ml-2">
          <FontAwesomeIcon icon={faMapLocationDot} className="text-white" />
        </span>
        <span className="pl-2">postcard.</span>
      </Link>

      <button
        className="absolute bg-primary-300 px-4 inline"
        style={{ left: "50%", transform: "translateX(-50%)" }} // perfectly centered :)
        onClick={() => {
          router.push("/post/create");
        }}
      >
        <FontAwesomeIcon icon={faPlus} />
        <span className="pl-2">create post</span>
      </button>

      {/* if not logged in */}
      {/* <span className="flex gap-2 place-items-center pr-2">
        <button className="bg-primary-300 px-4">sign up</button>
        <button className="bg-secondary-100 px-4 border-background-300">
          log in
        </button>
      </span> */}

      {/* if logged in, click route to /account */}
      <span className="flex gap-4 place-items-center pr-2">
        <Link href="/account" className="h-full flex place-items-center">
          <span className="aspect-square h-full flex items-center justify-center rounded-full overflow-hidden">
            {/* TODO: replace with user profile pic */}
            <img
              src={"https://picsum.photos/32/32"}
              alt="profile"
              className="rounded-full w-6"
            />
            {/* <span className="rounded-full h-6 w-6 bg-text-900"></span> */}
          </span>
          <span className="pl-2">Hello, user</span>
        </Link>
        <button className="bg-secondary-100 px-4 border-background-300">
          log out
        </button>
      </span>
    </header>
  );
}
