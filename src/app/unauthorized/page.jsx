import Link from "next/link";
import {
  ArrowLeft,
  Home,
  LockKeyhole,
  LogIn,
  ShieldAlert,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Unauthorized Access",
  description:
    "You do not have permission to access the requested MediAssist page.",
};

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const session = await auth();

  const dashboardUrl = getDashboardUrl(
    session?.user?.role
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <section className="w-full max-w-xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert
            className="size-8"
            aria-hidden="true"
          />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-destructive">
          Access Restricted
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          You are not authorized
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          Your current account role to is page to access to
          of permission not is.
        </p>

        {session?.user ? (
          <div className="mt-6 rounded-xl border bg-muted/40 p-4 text-left">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <LockKeyhole
                  className="size-5"
                  aria-hidden="true"
                />
              </span>

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Current account
                </p>

                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {session.user.name || "MediAssist User"}
                </p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {session.user.email || "Email unavailable"}
                </p>

                <p className="mt-2 text-xs font-semibold capitalize text-primary">
                  Role:{" "}
                  {formatReadableRole(
                    session.user.role
                  )}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-amber-700 dark:text-amber-400">
            <p className="text-sm font-semibold">
              Login required
            </p>

            <p className="mt-1 text-sm leading-6">
              Restricted page access to for before your
              account in login please.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {session?.user ? (
            <Link
              href={dashboardUrl}
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Home
                className="size-4"
                aria-hidden="true"
              />

              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <LogIn
                className="size-4"
                aria-hidden="true"
              />

              Go to Login
            </Link>
          )}

          <Link
            href="/"
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-5 text-sm font-semibold transition hover:bg-muted"
          >
            <ArrowLeft
              className="size-4"
              aria-hidden="true"
            />

            Back to Home
          </Link>
        </div>

        <p className="mt-8 text-xs leading-5 text-muted-foreground">
          If you believe you should have access to this page,
          please contact the system administrator.
        </p>
      </section>
    </main>
  );
}

function getDashboardUrl(role) {
  if (role === USER_ROLES.ADMIN) {
    return "/admin/dashboard";
  }

  if (role === USER_ROLES.DOCTOR) {
    return "/doctor/dashboard";
  }

  if (role === USER_ROLES.PATIENT) {
    return "/patient/dashboard";
  }

  return "/";
}

function formatReadableRole(role) {
  if (!role) {
    return "Unknown";
  }

  return String(role)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}