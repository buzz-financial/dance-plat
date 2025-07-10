"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] font-serif px-4">
      <div className="bg-white/90 rounded-3xl shadow-2xl p-10 sm:p-16 flex flex-col items-center max-w-lg w-full">
        <div className="text-[var(--accent)] text-7xl sm:text-8xl font-extrabold mb-4 drop-shadow-lg">404</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">Page Not Found</h1>
        <p className="text-lg text-neutral-600 mb-8 text-center max-w-md">
          I missed a spot!<br />
          Try going back to the homepage or use the navigation menu.
        </p>
        <Link href="/" className="inline-block px-8 py-3 rounded-xl font-semibold bg-[var(--accent)] text-white shadow-lg hover:bg-indigo-700 transition-all text-lg">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
}
