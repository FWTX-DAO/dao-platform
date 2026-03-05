"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProjectDetails, useUpdateProject } from "@hooks/useProjects";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: project, isLoading } = useProjectDetails(id);
  const updateMutation = useUpdateProject();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubRepo: "",
    intent: "",
    benefitToFortWorth: "",
    tags: "",
  });

  useEffect(() => {
    if (project) {
      const p = project as any;
      setFormData({
        title: p.title || "",
        description: p.description || "",
        githubRepo: p.githubRepo || "",
        intent: p.intent || "",
        benefitToFortWorth: p.benefit || "",
        tags: p.tags || "",
      });
    }
  }, [project]);

  if (isLoading)
    return (
      <div className="py-8 text-center text-gray-500">Loading{"\u2026"}</div>
    );
  if (!project)
    return (
      <div className="py-8 text-center text-gray-500">Project not found</div>
    );

  const p = project as any;
  if (!p.user_is_creator) {
    return (
      <div className="py-8 text-center text-gray-500">
        Only the project creator can edit this project.
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    updateMutation.mutate(
      { id, ...formData },
      {
        onSuccess: (result: any) => {
          if (result && !result.success) {
            setError(result.error);
            return;
          }
          router.push(`/innovation-lab/${id}`);
        },
      },
    );
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Project</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="edit-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            id="edit-title"
            type="text"
            required
            value={formData.title}
            onChange={set("title")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-desc"
            className="block text-sm font-medium text-gray-700"
          >
            Description *
          </label>
          <textarea
            id="edit-desc"
            required
            value={formData.description}
            onChange={set("description")}
            rows={4}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-repo"
            className="block text-sm font-medium text-gray-700"
          >
            GitHub Repo
          </label>
          <input
            id="edit-repo"
            type="text"
            placeholder="e.g. org/repo"
            value={formData.githubRepo}
            onChange={set("githubRepo")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-intent"
            className="block text-sm font-medium text-gray-700"
          >
            Intent
          </label>
          <textarea
            id="edit-intent"
            value={formData.intent}
            onChange={set("intent")}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-benefit"
            className="block text-sm font-medium text-gray-700"
          >
            Benefit to Fort Worth
          </label>
          <textarea
            id="edit-benefit"
            value={formData.benefitToFortWorth}
            onChange={set("benefitToFortWorth")}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="edit-tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags (comma separated)
          </label>
          <input
            id="edit-tags"
            type="text"
            value={formData.tags}
            onChange={set("tags")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
          >
            {updateMutation.isPending ? "Saving\u2026" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
