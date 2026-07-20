"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  AlertTriangle,
  Home,
  RefreshCcw,
} from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}) {
  useEffect(() => {
    console.error(
      "MediAssist application error:",
      error
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle
            className="size-8"
            aria-hidden="true"
          />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-destructive">
          Something Went Wrong
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Application error
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          An unexpected error occurred while loading this page.
          Please try again. If the issue continues, return to the
          dashboard or home page.
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
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <RefreshCcw
              className="size-4"
              aria-hidden="true"
            />

            Try Again
          </button>

          <Link
            href="/"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
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
            Troubleshooting
          </p>

          <p className="mt-2 text-sm leading-6">
            Check your internet connection, refresh the page, and
            ensure that the database and environment variables are
            configured correctly.
          </p>
        </div>
      </section>
    </main>
  );
}
