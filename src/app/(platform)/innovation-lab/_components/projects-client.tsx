"use client";

import { useState } from "react";
import { useProjects } from "@hooks/useProjects";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";
import Link from "next/link";
import { PROJECT_STATUSES } from "@shared/constants";

export function ProjectsClient() {
  const { data: projects = [], isLoading } = useProjects();
  const { can } = useEntitlements();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? projects
      : projects.filter((p: any) => p.status === statusFilter);

  if (isLoading) {
    return (
      <div className="py-8 text-center text-gray-500">
        Loading projects{"\u2026"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Innovation Lab</h1>
          <p className="mt-2 text-gray-600">
            Civic innovation projects powered by the community
          </p>
        </div>
        <UpgradeCTA allowed={can.createProject} feature="create projects">
          <Link
            href="/innovation-lab/new"
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm"
          >
            New Project
          </Link>
        </UpgradeCTA>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            statusFilter === "all"
              ? "bg-violet-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {PROJECT_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
              statusFilter === s
                ? "bg-violet-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 font-medium">No projects found</p>
          <p className="text-gray-500 text-sm mt-1">
            Be the first to propose a civic innovation project!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((project: any) => (
            <Link
              key={project.id}
              href={`/innovation-lab/${project.id}`}
              className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    project.status === "active"
                      ? "bg-green-100 text-green-700"
                      : project.status === "completed"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {project.title}
              </h3>
              <p className="text-gray-600 mt-1 line-clamp-2">
                {project.description}
              </p>
              {project.tags && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.tags
                    .split(",")
                    .slice(0, 3)
                    .map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span>by {project.creator_name || "Anonymous"}</span>
                <span>
                  {project.collaborators} collaborator
                  {project.collaborators > 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
