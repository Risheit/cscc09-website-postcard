import Link from "next/link";

export default function Page() {
  return (
    <>
      Hello world! This is the landing page for un-authenticated users.
      Authenticated users should be automatically redirected to
      <Link href="/dashboard" className="px-1 text-primary-500 hover:underline">
        /dashboard
      </Link>
    </>
  );
}
