'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateBounty } from '@hooks/useBounties';
import { useEntitlements } from '@hooks/useEntitlements';
import { UpgradeCTA } from '@components/UpgradeCTA';

export default function SubmitBountyPage() {
  const router = useRouter();
  const createMutation = useCreateBounty();
  const { can } = useEntitlements();

  if (!can.submitBounty) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Submit a Bounty</h1>
        <UpgradeCTA allowed={false} feature="submit bounties" mode="banner">
          <span />
        </UpgradeCTA>
      </div>
    );
  }
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
          <label htmlFor="submit-title" className="block text-sm font-medium text-gray-700">Title *</label>
          <input id="submit-title" type="text" name="title" autoComplete="off" required value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <div>
          <label htmlFor="submit-organization" className="block text-sm font-medium text-gray-700">Organization Name *</label>
          <input id="submit-organization" type="text" name="organization" autoComplete="organization" required value={formData.organizationName} onChange={(e) => setFormData((p) => ({ ...p, organizationName: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <div>
          <label htmlFor="submit-description" className="block text-sm font-medium text-gray-700">Problem Statement *</label>
          <textarea id="submit-description" name="description" required value={formData.problemStatement} onChange={(e) => setFormData((p) => ({ ...p, problemStatement: e.target.value }))} rows={4} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <div>
          <label htmlFor="submit-requirements" className="block text-sm font-medium text-gray-700">Use Case *</label>
          <textarea id="submit-requirements" name="requirements" required value={formData.useCase} onChange={(e) => setFormData((p) => ({ ...p, useCase: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <div>
          <label htmlFor="submit-expected-outcomes" className="block text-sm font-medium text-gray-700">Desired Outcome *</label>
          <textarea id="submit-expected-outcomes" name="expectedOutcomes" required value={formData.desiredOutcome} onChange={(e) => setFormData((p) => ({ ...p, desiredOutcome: e.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <div>
          <label htmlFor="submit-budget" className="block text-sm font-medium text-gray-700">Bounty Amount ($)</label>
          <input id="submit-budget" type="number" name="budget" autoComplete="off" min="0" value={formData.bountyAmount} onChange={(e) => setFormData((p) => ({ ...p, bountyAmount: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <div>
          <label htmlFor="submit-timeline" className="block text-sm font-medium text-gray-700">Deliverables</label>
          <textarea id="submit-timeline" name="timeline" value={formData.deliverables} onChange={(e) => setFormData((p) => ({ ...p, deliverables: e.target.value }))} rows={4} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none" />
        </div>
        <button type="submit" disabled={createMutation.isPending} className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none">
          {createMutation.isPending ? `Submitting${'\u2026'}` : 'Submit Bounty'}
        </button>
      </form>
    </div>
  );
}
