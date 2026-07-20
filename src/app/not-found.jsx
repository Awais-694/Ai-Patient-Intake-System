import Link from "next/link";
import {
  ArrowLeft,
  Home,
  SearchX,
} from "lucide-react";

export const metadata = {
  title: "Page Not Found",
  description:
    "The requested MediAssist page could not be found.",
};

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <SearchX
            className="size-8"
            aria-hidden="true"
          />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Error 404
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Page not found
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          The page you are trying to open
          does not exist, has been removed, or the URL is incorrect
          is.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Home
              className="size-4"
              aria-hidden="true"
            />

            Go to Home
          </Link>

          <Link
            href="/login"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            Go to Login
          </Link>
        </div>

        <div className="mt-8 rounded-xl border bg-muted/40 p-4 text-left">
          <p className="text-sm font-semibold">
            Helpful checks
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            URL spelling check, browser back button use
            please, or your dashboard from required page again
            open please.
          </p>
        </div>
      </section>
    </main>
  );
}