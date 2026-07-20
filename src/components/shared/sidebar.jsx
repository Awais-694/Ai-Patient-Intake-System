"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  House,
  LayoutDashboard,
  Menu,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import LogoutButton from "@/components/auth/logout-button";
import { APP_NAME, USER_ROLES } from "@/lib/constants";

const navigationByRole = {
  [USER_ROLES.PATIENT]: [
    {
      label: "Home",
      href: "/",
      icon: House,
    },
    {
      label: "Dashboard",
      href: "/patient/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Book Appointment",
      href: "/patient/appointments/new",
      icon: CalendarPlus,
    },
    {
      label: "My Appointments",
      href: "/patient/appointments",
      icon: CalendarDays,
    },
    {
      label: "My Profile",
      href: "/patient/profile",
      icon: UserRound,
    },
  ],

  [USER_ROLES.DOCTOR]: [
    {
      label: "Dashboard",
      href: "/doctor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Appointments",
      href: "/doctor/appointments",
      icon: CalendarDays,
    },
    {
      label: "Patients",
      href: "/doctor/patients",
      icon: UsersRound,
    },
    {
      label: "Schedule",
      href: "/doctor/schedule",
      icon: ClipboardList,
    },
    {
      label: "Profile",
      href: "/doctor/profile",
      icon: Stethoscope,
    },
  ],

  [USER_ROLES.ADMIN]: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Doctors",
      href: "/admin/doctors",
      icon: Stethoscope,
    },
    {
      label: "Patients",
      href: "/admin/patients",
      icon: UsersRound,
    },
    {
      label: "Appointments",
      href: "/admin/appointments",
      icon: CalendarDays,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = session?.user;
  const role = user?.role;

  const navigationItems = navigationByRole[role] || [];

  function isActiveLink(href) {
    if (pathname === href) {
      return true;
    }

    // The booking page is nested under the appointments path, but it has
    // its own navigation item and must not activate My Appointments.
    if (href === "/patient/appointments") {
      return (
        pathname.startsWith(`${href}/`) &&
        !pathname.startsWith("/patient/appointments/new")
      );
    }

    return pathname.startsWith(`${href}/`);
  }

  function closeMobileSidebar() {
    setIsMobileOpen(false);
  }

  if (status === "loading") {
    return <SidebarSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="focus-ring fixed left-4 top-4 z-40 inline-flex size-10 items-center justify-center rounded-lg border bg-background shadow-sm lg:hidden"
        aria-label="Dashboard menu open please"
        aria-expanded={isMobileOpen}
        aria-controls="dashboard-sidebar"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      {isMobileOpen && (
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Dashboard menu close please"
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card text-card-foreground shadow-sm transition-all duration-200 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0 ${
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } ${
          isCollapsed
            ? "w-20"
            : "w-72"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link
            href="/"
            onClick={closeMobileSidebar}
            className="focus-ring flex min-w-0 items-center gap-3 rounded-md"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope
                className="size-5"
                aria-hidden="true"
              />
            </span>

            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate font-bold">
                  {APP_NAME}
                </p>

                <p className="truncate text-xs capitalize text-muted-foreground">
                  {role} portal
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="focus-ring inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Sidebar close please"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b p-4">
          <div
            className={`flex items-center ${
              isCollapsed
                ? "justify-center"
                : "gap-3"
            }`}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getInitials(user.name)}
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {user.name || "User"}
                </p>

                <p className="truncate text-xs text-muted-foreground">
                  {user.email || role}
                </p>
              </div>
            )}
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto p-3"
          aria-label={`${role} dashboard navigation`}
        >
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileSidebar}
                    title={isCollapsed ? item.label : undefined}
                    className={`focus-ring flex min-h-11 items-center rounded-lg text-sm font-medium transition ${
                      isCollapsed
                        ? "justify-center px-2"
                        : "gap-3 px-3"
                    } ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-current={
                      isActive ? "page" : undefined
                    }
                  >
                    <Icon
                      className="size-5 shrink-0"
                      aria-hidden="true"
                    />

                    {!isCollapsed && (
                      <span className="truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t p-3">
          <LogoutButton
            variant="destructive"
            label={isCollapsed ? "" : "Logout"}
            showIcon
            className={
              isCollapsed
                ? "w-full px-0"
                : "w-full"
            }
          />

          <button
            type="button"
            onClick={() =>
              setIsCollapsed(
                (currentValue) => !currentValue
              )
            }
            className="focus-ring mt-2 hidden h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground lg:flex"
            aria-label={
              isCollapsed
                ? "Sidebar expand please"
                : "Sidebar collapse please"
            }
          >
            {isCollapsed ? (
              <ChevronRight
                className="size-4"
                aria-hidden="true"
              />
            ) : (
              <>
                <ChevronLeft
                  className="size-4"
                  aria-hidden="true"
                />

                Collapse sidebar
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function SidebarSkeleton() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r bg-card p-4 lg:block">
      <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />

      <div className="mt-8 flex items-center gap-3">
        <div className="size-10 animate-pulse rounded-full bg-muted" />

        <div className="flex-1">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-36 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map(
          (_, index) => (
            <div
              key={index}
              className="h-11 animate-pulse rounded-lg bg-muted"
            />
          )
        )}
      </div>
    </aside>
  );
}
