import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/app/_lib/auth";
import { hasCompletedOnboarding } from "@utils/onboarding";
import { db, members } from "@core/database";
import { PlatformShell } from "./_components/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect("/");
  }

  const member = await db
    .select({
      onboardingStatus: members.onboardingStatus,
      email: members.email,
    })
    .from(members)
    .where(eq(members.userId, auth.user.id))
    .limit(1);

  if (
    !hasCompletedOnboarding(auth.user.username, member[0], auth.verifiedEmail)
  ) {
    redirect("/onboarding");
  }

  return <PlatformShell>{children}</PlatformShell>;
}
