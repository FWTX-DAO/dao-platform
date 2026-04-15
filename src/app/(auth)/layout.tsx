import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/app/_lib/auth";
import { db, members } from "@core/database";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/");
  }

  // If member already completed onboarding, send them to the dashboard
  const member = await db
    .select({ onboardingStatus: members.onboardingStatus })
    .from(members)
    .where(eq(members.userId, auth.user.id))
    .limit(1);

  if (member[0]?.onboardingStatus === "completed") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
