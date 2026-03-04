'use client';

import { useParams } from 'next/navigation';
import { useProjectDetails } from '@hooks/useProjects';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: project, isLoading } = useProjectDetails(id);

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading project...</div>;
  }

  if (!project) {
    return <div className="py-8 text-center text-gray-500">Project not found</div>;
  }

  const p = project as any;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>{p.status}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{p.title}</h1>
        <p className="text-gray-500 mt-1">by {p.creator_name || 'Anonymous'}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-700 whitespace-pre-line">{p.description}</p>
      </div>

      {p.intent && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Intent</h2>
          <p className="text-gray-700 whitespace-pre-line">{p.intent}</p>
        </div>
      )}

      {p.benefit && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Community Benefit</h2>
          <p className="text-gray-700 whitespace-pre-line">{p.benefit}</p>
        </div>
      )}

      {project.collaborators && project.collaborators.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Collaborators ({project.total_collaborators || project.collaborators.length})
          </h2>
          <div className="space-y-2">
            {project.collaborators.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{c.username || 'Anonymous'}</span>
                <span className="text-xs text-gray-500">{c.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
