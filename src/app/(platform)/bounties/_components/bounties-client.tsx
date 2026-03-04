'use client';

import { useBounties } from '@hooks/useBounties';

export function BountiesClient() {
  const { data: bounties = [], isLoading } = useBounties();

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading bounties...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Innovation Bounties</h1>
      <p className="text-gray-600">Browse funded opportunities to contribute to Fort Worth civic innovation</p>
      {bounties.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No bounties available yet.</div>
      ) : (
        <div className="space-y-4">
          {bounties.map((bounty: any) => (
            <a
              key={bounty.id}
              href={`/bounties/${bounty.id}`}
              className="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{bounty.category}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      bounty.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{bounty.status}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{bounty.title}</h3>
                  <p className="text-gray-600 mt-1 line-clamp-2">{bounty.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {bounty.proposalCount || 0} proposal{bounty.proposalCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {bounty.bountyAmount && (
                  <div className="text-right ml-4">
                    <p className="font-bold text-green-600 text-xl">${(bounty.bountyAmount / 100).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
