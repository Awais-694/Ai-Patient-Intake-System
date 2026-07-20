"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  CalendarPlus,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react";

import { APP_NAME, USER_ROLES } from "@/lib/constants";

const publicNavigation = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Doctors",
    href: "/doctors",
  },
  {
    label: "About",
    href: "/about",
  },
];

function getDashboardPath(role) {
  if (role === USER_ROLES.ADMIN) {
    return "/admin/dashboard";
  }

  if (role === USER_ROLES.DOCTOR) {
    return "/doctor/dashboard";
  }

  return "/patient/dashboard";
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  const dashboardPath = getDashboardPath(user?.role);
  const visibleNavigation = isAuthenticated
    ? []
    : publicNavigation;

  function isActiveLink(href) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  async function handleLogout() {
    setMobileMenuOpen(false);

    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="focus-ring flex shrink-0 items-center gap-2 rounded-md"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope
                className="size-5"
                aria-hidden="true"
              />
            </span>

            <span className="text-lg font-bold tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary navigation"
          >
            {visibleNavigation.map((item) => {
              const active = isActiveLink(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isLoading && (
              <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
            )}

            {!isLoading && !isAuthenticated && (
              <>
                <Link
                  href="/login"
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  <LogIn
                    className="size-4"
                    aria-hidden="true"
                  />
                  Login
                </Link>

                <Link
                  href="/register"
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <UserPlus
                    className="size-4"
                    aria-hidden="true"
                  />
                  Register
                </Link>
              </>
            )}

            {!isLoading && isAuthenticated && (
              <>
                {user?.role === USER_ROLES.PATIENT && (
                  <Link
                    href="/patient/appointments/new"
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                  >
                    <CalendarPlus
                      className="size-4"
                      aria-hidden="true"
                    />
                    Book appointment
                  </Link>
                )}

                <Link
                  href={dashboardPath}
                  className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <LayoutDashboard
                    className="size-4"
                    aria-hidden="true"
                  />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border bg-background transition hover:bg-muted"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut
                    className="size-4"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen((currentValue) => !currentValue)
            }
            className="focus-ring inline-flex size-10 items-center justify-center rounded-lg border bg-background transition hover:bg-muted md:hidden"
            aria-label={
              mobileMenuOpen
                ? "Navigation menu close please"
                : "Navigation menu open please"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <X
                className="size-5"
                aria-hidden="true"
              />
            ) : (
              <Menu
                className="size-5"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            className="border-t py-4 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-1">
              {visibleNavigation.map((item) => {
                const active = isActiveLink(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`focus-ring rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 border-t pt-4">
              {isLoading && (
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
              )}

              {!isLoading && !isAuthenticated && (
                <div className="grid gap-2">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                  >
                    <LogIn
                      className="size-4"
                      aria-hidden="true"
                    />
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMobileMenu}
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <UserPlus
                      className="size-4"
                      aria-hidden="true"
                    />
                    Register
                  </Link>
                </div>
              )}

              {!isLoading && isAuthenticated && (
                <div className="grid gap-2">
                  <div className="rounded-lg bg-muted px-3 py-3">
                    <p className="truncate text-sm font-semibold">
                      {user?.name || "User"}
                    </p>

                    <p className="truncate text-xs capitalize text-muted-foreground">
                      {user?.role || "user"}
                    </p>
                  </div>

                  {user?.role === USER_ROLES.PATIENT && (
                    <Link
                      href="/patient/appointments/new"
                      onClick={closeMobileMenu}
                      className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                    >
                      <CalendarPlus
                        className="size-4"
                        aria-hidden="true"
                      />
                      Book appointment
                    </Link>
                  )}

                  <Link
                    href={dashboardPath}
                    onClick={closeMobileMenu}
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <LayoutDashboard
                      className="size-4"
                      aria-hidden="true"
                    />
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                  >
                    <LogOut
                      className="size-4"
                      aria-hidden="true"
                    />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
