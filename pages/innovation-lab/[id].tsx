import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, getAccessToken } from "@privy-io/react-auth";
import AppLayout from "../../components/AppLayout";
import { 
  BeakerIcon,
  PencilIcon,
  LinkIcon,
  UserGroupIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

interface ProjectCollaborator {
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

interface ProjectDetails {
  id: string;
  title: string;
  description: string;
  github_repo: string;
  intent: string;
  benefit_to_fort_worth: string;
  status: "proposed" | "active" | "completed";
  tags: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string | null;
  created_at: string;
  updated_at: string;
  collaborators: ProjectCollaborator[];
  total_collaborators: number;
  user_is_collaborator: boolean;
  user_is_creator: boolean;
}

const statusColors = {
  proposed: "bg-yellow-100 text-yellow-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ready, authenticated } = usePrivy();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    githubRepo: "",
    intent: "",
    benefitToFortWorth: "",
    tags: "",
    status: "proposed" as "proposed" | "active" | "completed",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated && id && typeof id === "string") {
      fetchProjectDetails(id);
    }
  }, [authenticated, id]);

  const fetchProjectDetails = async (projectId: string) => {
    try {
      setIsLoading(true);
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data);
        // Initialize edit form with current data
        setEditForm({
          title: data.title,
          description: data.description,
          githubRepo: data.github_repo,
          intent: data.intent,
          benefitToFortWorth: data.benefit_to_fort_worth,
          tags: data.tags || "",
          status: data.status,
        });
      } else if (response.status === 404) {
        setError("Project not found");
      } else {
        setError("Failed to load project details");
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
      setError("Failed to load project details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form to original values
    if (project) {
      setEditForm({
        title: project.title,
        description: project.description,
        githubRepo: project.github_repo,
        intent: project.intent,
        benefitToFortWorth: project.benefit_to_fort_worth,
        tags: project.tags || "",
        status: project.status,
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!project || !id) return;

    setIsSaving(true);
    setError("");

    try {
      const accessToken = await getAccessToken();
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...editForm,
          tags: editForm.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        const updatedProject = await response.json();
        setProject(updatedProject);
        setIsEditing(false);
      } else {
        throw new Error("Failed to update project");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!ready || !authenticated) return null;

  if (isLoading) {
    return (
      <AppLayout title="Loading Project...">
        <div className="py-8 text-center text-gray-500">Loading project details...</div>
      </AppLayout>
    );
  }

  if (error && !project) {
    return (
      <AppLayout title="Error">
        <div className="py-8 text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push("/innovation-lab")}
            className="text-violet-600 hover:text-violet-700"
          >
            ← Back to Innovation Lab
          </button>
        </div>
      </AppLayout>
    );
  }

  if (!project) return null;

  const tags = project.tags ? project.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <AppLayout title={`${project.title} - Civic Innovation Lab`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/innovation-lab")}
            className="flex items-center gap-2 text-violet-600 hover:text-violet-700"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Innovation Lab
          </button>
          
          {project.user_is_creator && (
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit Project
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    <CheckIcon className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Project Details */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <BeakerIcon className="h-12 w-12 text-violet-600" />
                <div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="text-2xl font-bold text-gray-900 w-full border-b-2 border-gray-300 focus:border-violet-500 focus:outline-none bg-transparent"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  )}
                  <p className="text-gray-600 mt-1">
                    Created by {project.creator_name || "Anonymous"} • {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isEditing ? (
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="proposed">Proposed</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                )}
                <a
                  href={project.github_repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-violet-600 hover:text-violet-700"
                >
                  <LinkIcon className="h-5 w-5" />
                  GitHub Repository
                </a>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-3 focus:border-violet-500 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-gray-700">{project.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Intent & Purpose</label>
                {isEditing ? (
                  <textarea
                    value={editForm.intent}
                    onChange={(e) => setEditForm({ ...editForm, intent: e.target.value })}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-3 focus:border-violet-500 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-gray-700">{project.intent}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Benefit to Fort Worth</label>
                {isEditing ? (
                  <textarea
                    value={editForm.benefitToFortWorth}
                    onChange={(e) => setEditForm({ ...editForm, benefitToFortWorth: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md p-3 focus:border-violet-500 focus:ring-violet-500"
                  />
                ) : (
                  <p className="text-gray-700">{project.benefit_to_fort_worth}</p>
                )}
              </div>

              {isEditing && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 uppercase mb-2">GitHub Repository</label>
                  <input
                    type="url"
                    value={editForm.githubRepo}
                    onChange={(e) => setEditForm({ ...editForm, githubRepo: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-3 focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 uppercase mb-2">Tags</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="infrastructure, sustainability, education"
                    className="w-full border border-gray-300 rounded-md p-3 focus:border-violet-500 focus:ring-violet-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.length > 0 ? (
                      tags.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No tags</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collaborators */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Collaborators ({project.total_collaborators})
              </h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {project.collaborators.map(collaborator => (
                <div key={collaborator.user_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-10 w-10 bg-violet-600 rounded-full flex items-center justify-center text-white font-medium">
                    {collaborator.avatar_url ? (
                      <img 
                        src={collaborator.avatar_url} 
                        alt={collaborator.username}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      collaborator.username?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {collaborator.username || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        collaborator.role === "creator" 
                          ? "bg-violet-100 text-violet-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {collaborator.role}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(collaborator.joined_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}