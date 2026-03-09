import { redirect } from 'next/navigation';
import { getAuthUser, isUserAdmin } from '@/app/_lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser();
  if (!auth) redirect('/');

  const admin = await isUserAdmin(auth.user.id);
  if (!admin) redirect('/dashboard');

  return <>{children}</>;
}
