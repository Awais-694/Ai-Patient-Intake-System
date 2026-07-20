
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Patient Portal",
  description:
    "MediAssist patient portal.",
};

export const dynamic = "force-dynamic";

export default async function PatientRootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(
      "/login?callbackUrl=/patient"
    );
  }

  if (
    session.user.role !==
    USER_ROLES.PATIENT
  ) {
    redirect("/unauthorized");
  }

  redirect("/patient/dashboard");
}