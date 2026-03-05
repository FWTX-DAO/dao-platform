'use client';

import { useParams } from 'next/navigation';
import { useBountyDetails } from '@hooks/useBounties';

export default function BountyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: bounty, isLoading } = useBountyDetails(id);

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading bounty{'\u2026'}</div>;
  }

  if (!bounty) {
    return <div className="py-8 text-center text-gray-500">Bounty not found</div>;
  }

  const b = bounty as any;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{b.category}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            b.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>{b.status}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{b.title}</h1>
        {b.bountyAmount && (
          <p className="text-2xl font-bold text-green-600 mt-2 tabular-nums">${(b.bountyAmount / 100).toLocaleString()}</p>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Problem Statement</h2>
        <p className="text-gray-700 whitespace-pre-line">{b.problemStatement}</p>
      </div>

      {b.useCase && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Use Case</h2>
          <p className="text-gray-700 whitespace-pre-line">{b.useCase}</p>
        </div>
      )}

      {b.desiredOutcome && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Desired Outcome</h2>
          <p className="text-gray-700 whitespace-pre-line">{b.desiredOutcome}</p>
        </div>
      )}

      {b.deliverables && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverables</h2>
          <p className="text-gray-700 whitespace-pre-line">{b.deliverables}</p>
        </div>
      )}
    </div>
  );
}
