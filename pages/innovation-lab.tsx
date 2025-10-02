import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@components/AppLayout";
import { 
  BeakerIcon,
  PlusIcon,
  LinkIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";
import { useProjects, useCreateProject } from "@hooks/useProjects";

const statusColors: Record<string, string> = {
  proposed: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

export default function InnovationLabPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const queryClient = useQueryClient();
  
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    githubRepo: "",
    intent: "",
    benefitToFortWorth: "",
    tags: "",
  });

  const { data: projects = [], isLoading, error: projectsError } = useProjects();
  const createProjectMutation = useCreateProject();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (projectsError) {
      setError("Failed to load projects");
    }
  }, [projectsError]);

  const handleCreateProject = () => {
    if (newProject.title && newProject.description && newProject.githubRepo && 
        newProject.intent && newProject.benefitToFortWorth) {
      setError("");

      createProjectMutation.mutate({
        title: newProject.title,
        description: newProject.description,
        githubRepo: newProject.githubRepo,
        intent: newProject.intent,
        benefitToFortWorth: newProject.benefitToFortWorth,
        tags: newProject.tags.split(",").map(tag => tag.trim()).filter(Boolean),
      }, {
        onSuccess: () => {
          setNewProject({
            title: "",
            description: "",
            githubRepo: "",
            intent: "",
            benefitToFortWorth: "",
            tags: "",
          });
          setShowCreateProject(false);
        },
        onError: () => {
          setError("Failed to create project. Please try again.");
        }
      });
    }
  };

  const filteredProjects = statusFilter === "all"
    ? projects
    : projects.filter(project => project.status === statusFilter);

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Civic Innovation Lab - Fort Worth TX DAO">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Civic Innovation Lab</h1>
            <p className="mt-2 text-gray-600">Build projects that benefit Fort Worth</p>
          </div>
          <button
            onClick={() => setShowCreateProject(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusFilter === "all"
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setStatusFilter("proposed")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusFilter === "proposed"
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Proposed
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusFilter === "active"
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusFilter === "completed"
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
              <h2 className="text-xl font-bold mb-4">Create New Project</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Title</label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="Fort Worth Smart Parking"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="Brief description of your project"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GitHub Repository</label>
                  <input
                    type="url"
                    value={newProject.githubRepo}
                    onChange={(e) => setNewProject({ ...newProject, githubRepo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Intent & Purpose</label>
                  <textarea
                    value={newProject.intent}
                    onChange={(e) => setNewProject({ ...newProject, intent: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="What problem does this solve?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Benefit to Fort Worth</label>
                  <textarea
                    value={newProject.benefitToFortWorth}
                    onChange={(e) => setNewProject({ ...newProject, benefitToFortWorth: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="How will this specifically benefit Fort Worth residents?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newProject.tags}
                    onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="infrastructure, sustainability, education"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreateProject(false)}
                    disabled={createProjectMutation.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading projects...</div>
        ) : error && projects.length === 0 ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : projects.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No projects yet. Be the first to create one!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map(project => {
              const tags = project.tags ? project.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
              return (
                 <div 
                   key={project.id} 
                   className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => router.push(`/innovation-lab/${project.id}`)}
                   onMouseEnter={() => {
                     queryClient.prefetchQuery({
                       queryKey: ["project-details", project.id],
                       queryFn: async () => {
                         const { getAccessToken } = await import("@privy-io/react-auth");
                         const accessToken = await getAccessToken();
                         const response = await fetch(`/api/projects/${project.id}`, {
                           headers: { Authorization: `Bearer ${accessToken}` },
                         });
                         if (!response.ok) throw new Error('Failed to fetch');
                         return response.json();
                       },
                     });
                   }}
                 >
                  <div className="flex items-center justify-between mb-4">
                    <BeakerIcon className="h-8 w-8 text-violet-600" />
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Intent</p>
                      <p className="text-sm text-gray-700">{project.intent}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase">Fort Worth Benefit</p>
                      <p className="text-sm text-gray-700">{project.benefit_to_fort_worth}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{project.collaborators} collaborators</span>
                    </div>
                     <a
                       href={project.github_repo}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center gap-1 text-violet-600 hover:text-violet-700"
                       onClick={(e) => e.stopPropagation()}
                     >
                      <LinkIcon className="h-4 w-4" />
                      GitHub
                    </a>
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {tags.map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                    Created by {project.creator_name || "Anonymous"} • {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}