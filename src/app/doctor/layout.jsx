import { redirect } from "next/navigation";

import Sidebar from "@/components/shared/sidebar";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export default async function DoctorLayout({ children }) {
  const session = await auth();

  /*
    Redirect the user to the login page when no session exists.
  */
  if (!session?.user) {
    redirect("/login?callbackUrl=/doctor/dashboard");
  }

  /*
    Disabled doctor account to protected area access
    not dena.
  */
  if (session.user.isActive === false) {
    redirect("/login?error=AccountDisabled");
  }

  /*
    only doctor role doctor routes access can.
  */
  if (session.user.role !== USER_ROLES.DOCTOR) {
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
