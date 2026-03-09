"use client";

import { useState } from "react";
import { useProjects } from "@hooks/useProjects";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";
import Link from "next/link";
import { PROJECT_STATUSES } from "@shared/constants";
import { PageHeader } from "@components/ui/page-header";
import { FilterPills } from "@components/ui/filter-pills";
import { EmptyState } from "@components/ui/empty-state";
import { ErrorState } from "@components/ui/error-state";
import { SkeletonGrid } from "@components/ui/skeleton";
import { Lightbulb } from "lucide-react";

const ALL_STATUSES = ["all", ...PROJECT_STATUSES] as const;

export function ProjectsClient() {
  const { data: projects = [], isLoading, isError, refetch } = useProjects();
  const { can } = useEntitlements();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered =
    statusFilter === "all"
      ? projects
      : projects.filter((p: any) => p.status === statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader title="Innovation Lab" subtitle="Civic innovation projects powered by the community">
        <UpgradeCTA allowed={can.createProject} feature="create projects">
          <Link
            href="/innovation-lab/new"
            className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden transition-colors"
          >
            New Project
          </Link>
        </UpgradeCTA>
      </PageHeader>

      <FilterPills
        options={ALL_STATUSES}
        value={statusFilter}
        onChange={setStatusFilter}
        ariaLabel="Filter projects by status"
      />

      {isError ? (
        <ErrorState title="Failed to load projects" onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonGrid count={4} cols={2} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Lightbulb />}
          title={statusFilter !== "all" ? "No projects match this filter" : "No projects found"}
          description={
            statusFilter !== "all"
              ? "Try selecting a different status filter."
              : can.createProject
                ? "Be the first to propose a civic innovation project!"
                : "Projects will appear here once community members start creating them."
          }
          action={
            statusFilter !== "all" ? (
              <button
                onClick={() => setStatusFilter("all")}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
              >
                Clear filter
              </button>
            ) : can.createProject ? (
              <Link
                href="/innovation-lab/new"
                className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm min-h-[44px]"
              >
                Submit Project
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((project: any) => (
            <Link
              key={project.id}
              href={`/innovation-lab/${project.id}`}
              className="bg-white shadow-xs rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
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
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {project.title}
              </h3>
              <p className="text-gray-600 mt-1 line-clamp-2 text-sm">
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
                        className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm"
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
                  {project.collaborators !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
