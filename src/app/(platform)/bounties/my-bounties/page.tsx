'use client';

import Link from 'next/link';
import { useBounties } from '@hooks/useBounties';
import { usePrivy } from '@privy-io/react-auth';
import { useEntitlements } from '@hooks/useEntitlements';
import { UpgradeCTA } from '@components/UpgradeCTA';

export default function MyBountiesPage() {
  const { data: bounties = [], isLoading } = useBounties();
  const { user } = usePrivy();
  const { can } = useEntitlements();

  const myBounties = bounties.filter((b: any) => b.submitterId === user?.id);

  if (isLoading) return <div className="py-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Bounties</h1>
        <UpgradeCTA allowed={can.submitBounty} feature="submit bounties">
          <Link href="/bounties/submit" className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm">
            Submit New
          </Link>
        </UpgradeCTA>
      </div>
      {myBounties.length === 0 ? (
        <div className="py-8 text-center text-gray-500">You haven&apos;t submitted any bounties yet.</div>
      ) : (
        <div className="space-y-4">
          {myBounties.map((bounty: any) => (
            <Link key={bounty.id} href={`/bounties/${bounty.id}`} className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900">{bounty.title}</h3>
              <p className="text-gray-600 mt-1 line-clamp-2">{bounty.description}</p>
              <span className={`mt-2 inline-block text-xs px-2 py-1 rounded-full font-medium ${
                bounty.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>{bounty.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
