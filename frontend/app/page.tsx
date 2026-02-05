import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center flex-col gap-6">
      <h1 className="text-3xl font-semibold">Movement Coach</h1>
      <p className="text-zinc-500 text-sm max-w-xs text-center">
        A guided movement experience for seated computer users.
      </p>
      <Link
        href="/session"
        className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-lg font-medium hover:bg-zinc-700 transition-colors"
      >
        Begin Session
      </Link>
    </div>
  );
}
