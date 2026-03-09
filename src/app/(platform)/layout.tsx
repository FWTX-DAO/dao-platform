import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getAuthUser } from '@/app/_lib/auth';
import { needsOnboarding } from '@utils/onboarding';
import { db, members } from '@core/database';
import { PlatformShell } from './_components/platform-shell';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect('/');
  }

  // Check username pattern first (fast, no DB query)
  if (needsOnboarding(auth.user.username)) {
    redirect('/onboarding');
  }

  // Also check if member has completed onboarding (catches email-prefix usernames)
  const member = await db
    .select({ onboardingStatus: members.onboardingStatus })
    .from(members)
    .where(eq(members.userId, auth.user.id))
    .limit(1);

  if (!member[0] || member[0].onboardingStatus !== 'completed') {
    redirect('/onboarding');
  }

  return <PlatformShell>{children}</PlatformShell>;
}
