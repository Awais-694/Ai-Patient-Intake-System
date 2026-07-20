import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Login",
  description:
    "Login to your MediAssist patient, doctor, or admin account.",
};

function getDashboardPath(role) {
  if (role === USER_ROLES.ADMIN) {
    return "/admin/dashboard";
  }

  if (role === USER_ROLES.DOCTOR) {
    return "/doctor/dashboard";
  }

  return "/patient/dashboard";
}

export default async function LoginPage() {
  const session = await auth();

  /*
    If user already logged in is,
    to login page again show will not.
  */
  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  return <LoginForm />;
}