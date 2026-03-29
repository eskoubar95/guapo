"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary. Must define its own <html> and <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[storefront] global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 font-sans antialiased text-foreground">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-neutral-600">
            A critical error occurred. Please refresh or try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
