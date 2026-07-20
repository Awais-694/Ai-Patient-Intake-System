
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export const metadata = {
  title: "Admin Portal",
  description:
    "MediAssist administration portal.",
};

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(
      "/login?callbackUrl=/admin"
    );
  }

  if (
    session.user.role !==
    USER_ROLES.ADMIN
  ) {
    redirect("/unauthorized");
  }

  redirect("/admin/dashboard");
}