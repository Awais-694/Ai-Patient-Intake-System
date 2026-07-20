import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

/*
  `auth()` provides the current user's session to the proxy.
  Logged-in user information is available at request.auth.user.
*/
export default auth((request) => {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  const session = request.auth;
  const user = session?.user;

  // Redirect unauthenticated users from protected routes to login.
  if (!user) {
    const loginUrl = new URL("/login", nextUrl.origin);

    // Preserve the requested URL so it can be restored after login.
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${nextUrl.search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  // Disabled accounts cannot access protected pages.
  if (user.isActive === false) {
    const loginUrl = new URL("/login", nextUrl.origin);

    loginUrl.searchParams.set("error", "AccountDisabled");

    return NextResponse.redirect(loginUrl);
  }

  // Patient routes are restricted to patients.
  if (
    pathname.startsWith("/patient") &&
    user.role !== USER_ROLES.PATIENT
  ) {
    return NextResponse.redirect(
      new URL("/unauthorized", nextUrl.origin)
    );
  }

  // Doctor routes are restricted to doctors.
  if (
    pathname.startsWith("/doctor") &&
    user.role !== USER_ROLES.DOCTOR
  ) {
    return NextResponse.redirect(
      new URL("/unauthorized", nextUrl.origin)
    );
  }

  // Admin routes are restricted to administrators.
  if (
    pathname.startsWith("/admin") &&
    user.role !== USER_ROLES.ADMIN
  ) {
    return NextResponse.redirect(
      new URL("/unauthorized", nextUrl.origin)
    );
  }

  // Authenticated users with the correct role may continue.
  return NextResponse.next();
});

// Run the proxy only for protected dashboard routes.
export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/admin/:path*",
  ],
};
