import Link from "next/link";

export default function Page() {
  return (
    <div className="bg-background-100 flex w-full py-10">
      <div className="container mx-auto flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mt-6">
          Welcome to <span className="text-primary-500">postcard.</span>
        </h1>
        <p className="text-lg mt-4 text-center">
          This is the landing page for un-authenticated users. Authenticated
          users should be automatically redirected to
          <Link
            href="/dashboard"
            className="px-1 text-primary-500 hover:underline"
          >
            /dashboard
          </Link>
        </p>
        {/* TODO: add signup link */}
        <button className="mt-6 px-4 py-2 bg-primary-500 text-background-900 rounded hover:bg-primary-400">
          Get Started
        </button>
      </div>
    </div>
  );
}
