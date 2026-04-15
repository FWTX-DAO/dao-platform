"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useProjectDetails,
  useProjectUpdates,
  useJoinProject,
  useLeaveProject,
  useDeleteProject,
  useCreateProjectUpdate,
} from "@hooks/useProjects";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading } = useProjectDetails(id);
  const { data: updates = [] } = useProjectUpdates(id);
  const joinMutation = useJoinProject();
  const leaveMutation = useLeaveProject();
  const deleteMutation = useDeleteProject();
  const createUpdateMutation = useCreateProjectUpdate();

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", content: "" });

  if (isLoading)
    return (
      <div className="py-8 text-center text-gray-500">Loading project{"…"}</div>
    );
  if (!project)
    return (
      <div className="py-8 text-center text-gray-500">Project not found</div>
    );

  const p = project as any;

  const handleJoin = () => {
    joinMutation.mutate(id);
  };

  const handleLeave = () => {
    if (!confirm("Are you sure you want to leave this project?")) return;
    leaveMutation.mutate(id);
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/innovation-lab"),
    });
  };

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    createUpdateMutation.mutate(
      { projectId: id, updateData: updateForm },
      {
        onSuccess: () => {
          setShowUpdateForm(false);
          setUpdateForm({ title: "", content: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                p.status === "active"
                  ? "bg-green-100 text-green-700"
                  : p.status === "completed"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
              }`}
            >
              {p.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{p.title}</h1>
          <p className="text-gray-500 mt-1">
            by {p.creator_name || "Anonymous"} &middot; {p.total_collaborators}{" "}
            collaborators
          </p>
        </div>
        <div className="flex gap-2">
          {p.user_is_creator && (
            <>
              <Link
                href={`/innovation-lab/${id}/edit`}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </>
          )}
          {!p.user_is_collaborator && !p.user_is_creator && (
            <button
              onClick={handleJoin}
              disabled={joinMutation.isPending}
              className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
            >
              {joinMutation.isPending ? "Joining..." : "Join Project"}
            </button>
          )}
          {p.user_is_collaborator && !p.user_is_creator && (
            <button
              onClick={handleLeave}
              disabled={leaveMutation.isPending}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              {leaveMutation.isPending ? "Leaving..." : "Leave Project"}
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Description
        </h2>
        <p className="text-gray-700 whitespace-pre-line">{p.description}</p>
      </div>

      {p.intent && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Intent</h2>
          <p className="text-gray-700 whitespace-pre-line">{p.intent}</p>
        </div>
      )}

      {p.benefit && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Community Benefit
          </h2>
          <p className="text-gray-700 whitespace-pre-line">{p.benefit}</p>
        </div>
      )}

      {p.githubRepo && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            GitHub Repository
          </h2>
          <a
            href={
              p.githubRepo.startsWith("http")
                ? p.githubRepo
                : `https://github.com/${p.githubRepo}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:underline text-sm"
          >
            {p.githubRepo}
          </a>
        </div>
      )}

      {p.tags && (
        <div className="flex flex-wrap gap-2">
          {p.tags.split(",").map((tag: string) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Collaborators */}
      {project.collaborators && project.collaborators.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Collaborators ({project.total_collaborators})
          </h2>
          <div className="space-y-2">
            {project.collaborators.map((c: any) => (
              <div
                key={c.userId}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-sm"
              >
                <span className="text-sm text-gray-700">
                  {c.username || "Anonymous"}
                </span>
                <span className="text-xs text-gray-500">{c.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Updates */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Updates</h2>
          {p.user_is_collaborator && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="px-3 py-1.5 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
            >
              {showUpdateForm ? "Cancel" : "Post Update"}
            </button>
          )}
        </div>

        {showUpdateForm && (
          <form
            onSubmit={handlePostUpdate}
            className="mb-6 space-y-3 border border-gray-200 rounded-lg p-4"
          >
            <input
              type="text"
              placeholder="Update title"
              value={updateForm.title}
              onChange={(e) =>
                setUpdateForm((p) => ({ ...p, title: e.target.value }))
              }
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
            <textarea
              placeholder="What's new?"
              value={updateForm.content}
              onChange={(e) =>
                setUpdateForm((p) => ({ ...p, content: e.target.value }))
              }
              required
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            />
            <button
              type="submit"
              disabled={createUpdateMutation.isPending}
              className="px-4 py-2 bg-violet-600 text-white rounded-md text-sm hover:bg-violet-700"
            >
              {createUpdateMutation.isPending ? "Posting..." : "Post"}
            </button>
          </form>
        )}

        {updates.length === 0 ? (
          <p className="text-gray-500 text-sm">No updates yet.</p>
        ) : (
          <div className="space-y-4">
            {updates.map((update: any) => (
              <div
                key={update.id}
                className="border-l-2 border-violet-200 pl-4"
              >
                <h4 className="font-medium text-gray-900 text-sm">
                  {update.title}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  by {update.author_name || "Anonymous"} &middot;{" "}
                  {new Date(update.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                  {update.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
