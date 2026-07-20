import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/register-form";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Create Account",
  description:
    "Create a patient or doctor account on MediAssist.",
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

export default async function RegisterPage({ searchParams }) {
  const session = await auth();

  // Redirect authenticated users to the dashboard for their role.
  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  const params = await searchParams;
  const defaultRole = params?.role === USER_ROLES.DOCTOR
    ? USER_ROLES.DOCTOR
    : USER_ROLES.PATIENT;

  return <RegisterForm defaultRole={defaultRole} />;
}
