"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject } from "@hooks/useProjects";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";

export default function NewProjectPage() {
  const router = useRouter();
  const createMutation = useCreateProject();
  const { can } = useEntitlements();
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubRepo: "",
    intent: "",
    benefitToFortWorth: "",
    tags: "",
  });

  if (!can.createProject) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">New Project</h1>
        <UpgradeCTA allowed={false} feature="create projects" mode="banner">
          <span />
        </UpgradeCTA>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createMutation.mutate(formData, {
      onSuccess: (result: any) => {
        if (result && !result.success) {
          setError(result.error);
          return;
        }
        router.push(
          result?.data?.id
            ? `/innovation-lab/${result.data.id}`
            : "/innovation-lab",
        );
      },
    });
  };

  const set =
    (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">New Project</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="project-title"
            className="block text-sm font-medium text-gray-700"
          >
            Title *
          </label>
          <input
            id="project-title"
            type="text"
            required
            value={formData.title}
            onChange={set("title")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="project-desc"
            className="block text-sm font-medium text-gray-700"
          >
            Description *
          </label>
          <textarea
            id="project-desc"
            required
            value={formData.description}
            onChange={set("description")}
            rows={4}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="project-repo"
            className="block text-sm font-medium text-gray-700"
          >
            GitHub Repo
          </label>
          <input
            id="project-repo"
            type="text"
            placeholder="e.g. org/repo"
            value={formData.githubRepo}
            onChange={set("githubRepo")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="project-intent"
            className="block text-sm font-medium text-gray-700"
          >
            Intent
          </label>
          <textarea
            id="project-intent"
            value={formData.intent}
            onChange={set("intent")}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="project-benefit"
            className="block text-sm font-medium text-gray-700"
          >
            Benefit to Fort Worth
          </label>
          <textarea
            id="project-benefit"
            value={formData.benefitToFortWorth}
            onChange={set("benefitToFortWorth")}
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div>
          <label
            htmlFor="project-tags"
            className="block text-sm font-medium text-gray-700"
          >
            Tags (comma separated)
          </label>
          <input
            id="project-tags"
            type="text"
            value={formData.tags}
            onChange={set("tags")}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-white focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            {createMutation.isPending ? "Creating…" : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
