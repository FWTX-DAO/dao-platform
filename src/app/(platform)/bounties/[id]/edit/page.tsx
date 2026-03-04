'use client';

import { useParams, useRouter } from 'next/navigation';
import { useBountyDetails, useUpdateBounty, useDeleteBounty } from '@hooks/useBounties';
import { useState, useEffect } from 'react';

export default function EditBountyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: bounty, isLoading } = useBountyDetails(id);
  const updateMutation = useUpdateBounty();
  const deleteMutation = useDeleteBounty();

  const [formData, setFormData] = useState({ title: '', problemStatement: '', category: '', deliverables: '' });

  useEffect(() => {
    if (bounty) {
      setFormData({
        title: (bounty as any).title || '',
        problemStatement: (bounty as any).problemStatement || '',
        category: (bounty as any).category || '',
        deliverables: (bounty as any).deliverables || '',
      });
    }
  }, [bounty]);

  if (isLoading) return <div className="py-8 text-center text-gray-500">Loading...</div>;
  if (!bounty) return <div className="py-8 text-center text-gray-500">Bounty not found</div>;

  const handleSave = () => {
    updateMutation.mutate({ id, ...formData } as any, {
      onSuccess: () => router.push(`/bounties/${id}`),
    });
  };

  const handleDelete = () => {
    if (!confirm('Are you sure?')) return;
    deleteMutation.mutate(id, {
      onSuccess: () => router.push('/bounties'),
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Edit Bounty</h1>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Problem Statement</label>
          <textarea value={formData.problemStatement} onChange={(e) => setFormData((p) => ({ ...p, problemStatement: e.target.value }))} rows={6} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2" />
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={updateMutation.isPending} className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Delete
          </button>
          <button onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}
