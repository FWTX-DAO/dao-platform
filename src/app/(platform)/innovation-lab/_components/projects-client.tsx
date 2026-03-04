'use client';

import { useProjects } from '@hooks/useProjects';
import Link from 'next/link';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

export function ProjectsClient() {
  const { data: projects = [], isLoading } = useProjects();

  if (isLoading) {
    return <div className="py-8 text-center text-gray-500">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Innovation Lab</h1>
          <p className="mt-2 text-gray-600">Civic innovation projects powered by the community</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <RocketLaunchIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to propose a civic innovation project!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project: any) => (
            <Link
              key={project.id}
              href={`/innovation-lab/${project.id}`}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>{project.status}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
              <p className="text-gray-600 mt-1 line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span>by {project.creator_name || 'Anonymous'}</span>
                <span>{project.collaborators} collaborator{project.collaborators > 1 ? 's' : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
