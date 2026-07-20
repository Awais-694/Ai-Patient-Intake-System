"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  Home,
  RefreshCcw,
} from "lucide-react";

export default function GlobalError({
  error,
  reset,
}) {
  useEffect(() => {
    console.error(
      "MediAssist critical application error:",
      error
    );
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 bg-background font-sans text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
          <section className="w-full max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertOctagon
                className="size-8"
                aria-hidden="true"
              />
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-destructive">
              Critical Error
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              MediAssist could not load
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              The critical application layout or startup process
              could not be loaded. Try again or return to the home
              page.
            </p>

            {error?.digest && (
              <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-left">
                <p className="text-xs font-medium text-muted-foreground">
                  Error reference
                </p>

                <p className="mt-2 break-all font-mono text-xs">
                  {error.digest}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <RefreshCcw
                  className="size-4"
                  aria-hidden="true"
                />

                Try Again
              </button>

              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-5 text-sm font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Home
                  className="size-4"
                  aria-hidden="true"
                />

                Go to Home
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-amber-700 dark:text-amber-400">
              <p className="text-sm font-semibold">
                Common causes
              </p>

              <p className="mt-2 text-sm leading-6">
                Check your environment variables, root layout imports,
                database configuration, global providers, and
                deployment settings.
              </p>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
