import { redirect } from 'next/navigation';
import { getAuthUser } from '@/app/_lib/auth';
import { needsOnboarding } from '@utils/onboarding';
import { PlatformShell } from './_components/platform-shell';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect('/');
  }

  if (needsOnboarding(auth.user.username)) {
    redirect('/onboarding');
  }

  return <PlatformShell>{children}</PlatformShell>;
}
