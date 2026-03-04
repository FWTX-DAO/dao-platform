import { redirect } from 'next/navigation';
import { getAuthUser } from '@/app/_lib/auth';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser();

  if (!auth) {
    redirect('/');
  }

  return <>{children}</>;
}
