import { redirect } from "next/navigation";

import Sidebar from "@/components/shared/sidebar";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export default async function AdminLayout({ children }) {
  const session = await auth();

  /*
    Redirect to the login page when no session is available.
  */
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  /*
    Disabled admin account to protected area access
    not dena.
  */
  if (session.user.isActive === false) {
    redirect("/login?error=AccountDisabled");
  }

  /*
    only admin role admin routes access can.
  */
  if (session.user.role !== USER_ROLES.ADMIN) {
    redirect("/unauthorized");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
