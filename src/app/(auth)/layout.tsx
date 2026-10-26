import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/app/_lib/auth";
import { db, members } from "@core/database";
import { hasCompletedOnboarding } from "@utils/onboarding";

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
    .select({
      onboardingStatus: members.onboardingStatus,
      email: members.email,
    })
    .from(members)
    .where(eq(members.userId, auth.user.id))
    .limit(1);

  if (
    hasCompletedOnboarding(auth.user.username, member[0], auth.verifiedEmail)
  ) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
