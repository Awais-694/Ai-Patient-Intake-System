
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Doctor Portal",
  description:
    "MediAssist doctor portal.",
};

export const dynamic = "force-dynamic";

export default async function DoctorRootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(
      "/login?callbackUrl=/doctor"
    );
  }

  if (
    session.user.role !==
    USER_ROLES.DOCTOR
  ) {
    redirect("/unauthorized");
  }

  redirect("/doctor/dashboard");
}