import { redirect } from "next/navigation";

import Sidebar from "@/components/shared/sidebar";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export default async function PatientLayout({
  children,
}) {
  const session = await auth();

  /*
    Redirect to the login page when no session exists.
  */
  if (!session?.user) {
    redirect(
      "/login?callbackUrl=/patient/dashboard"
    );
  }

  /*
    Disabled account to protected area access not dena.
  */
  if (session.user.isActive === false) {
    redirect("/login?error=AccountDisabled");
  }

  /*
    only patient role patient routes access can.
  */
  if (session.user.role !== USER_ROLES.PATIENT) {
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
