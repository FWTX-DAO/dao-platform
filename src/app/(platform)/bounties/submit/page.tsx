'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBounty } from '@hooks/useBounties';

export default function SubmitBountyPage() {
  const router = useRouter();
  const createMutation = useCreateBounty();
  const [formData, setFormData] = useState({
    title: '',
    problemStatement: '',
    useCase: '',
    desiredOutcome: '',
    category: 'general',
    bountyAmount: '',
    organizationType: 'civic',
    organizationName: '',
    deliverables: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { ...formData, bountyAmount: formData.bountyAmount ? Number(formData.bountyAmount) * 100 : undefined } as any,
      { onSuccess: (data: any) => router.push(`/bounties/${data.id}`) }
    );
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Submit a Bounty</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input type="text" required value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Organization Name *</label>
          <input type="text" required value={formData.organizationName} onChange={(e) => setFormData((p) => ({ ...p, organizationName: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Problem Statement *</label>
          <textarea required value={formData.problemStatement} onChange={(e) => setFormData((p) => ({ ...p, problemStatement: e.target.value }))} rows={4} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Use Case *</label>
          <textarea required value={formData.useCase} onChange={(e) => setFormData((p) => ({ ...p, useCase: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Desired Outcome *</label>
          <textarea required value={formData.desiredOutcome} onChange={(e) => setFormData((p) => ({ ...p, desiredOutcome: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Bounty Amount ($)</label>
          <input type="number" value={formData.bountyAmount} onChange={(e) => setFormData((p) => ({ ...p, bountyAmount: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deliverables</label>
          <textarea value={formData.deliverables} onChange={(e) => setFormData((p) => ({ ...p, deliverables: e.target.value }))} rows={4} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium">
          {createMutation.isPending ? 'Submitting...' : 'Submit Bounty'}
        </button>
      </form>
    </div>
  );
}
