"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useBounties,
  getBountyStatusColor,
  formatBountyAmount,
  getOrgTypeLabel,
} from "@hooks/useBounties";
import { useEntitlements } from "@hooks/useEntitlements";
import { UpgradeCTA } from "@components/UpgradeCTA";
import { BOUNTY_CATEGORIES, BOUNTY_STATUS_FILTERS } from "@shared/constants";
import { PageHeader } from "@components/ui/page-header";
import { FilterPills } from "@components/ui/filter-pills";
import { SearchInput } from "@components/ui/search-input";
import { EmptyState } from "@components/ui/empty-state";
import { ErrorState } from "@components/ui/error-state";
import { SkeletonList } from "@components/ui/skeleton";
import { Trophy } from "lucide-react";

export function BountiesClient() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const {
    data: bounties = [],
    isLoading,
    isError,
    refetch,
  } = useBounties({
    status: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
  });
  const { can } = useEntitlements();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Innovation Bounties"
        subtitle="Browse funded opportunities to contribute to Fort Worth civic innovation"
      >
        <UpgradeCTA allowed={can.submitBounty} feature="submit bounties">
          <Link
            href="/bounties/submit"
            className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden transition-colors"
          >
            Submit Bounty
          </Link>
        </UpgradeCTA>
        <Link
          href="/bounties/my-bounties"
          className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 min-h-[44px] focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden transition-colors"
        >
          My Bounties
        </Link>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search bounties…"
          aria-label="Search bounties"
        />
        <FilterPills
          options={BOUNTY_STATUS_FILTERS as readonly string[]}
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Filter by status"
        />
        <label className="sr-only" htmlFor="bounty-category">
          Category
        </label>
        <select
          id="bounty-category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden min-h-[44px]"
        >
          {BOUNTY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all"
                ? "All Categories"
                : cat
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <ErrorState title="Failed to load bounties" onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonList count={4} />
      ) : bounties.length === 0 ? (
        <EmptyState
          icon={<Trophy />}
          title="No bounties match your filters"
          description="Try adjusting your search or filters to find what you're looking for."
          action={
            search || statusFilter !== "all" || categoryFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
              >
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {bounties.map((bounty: any) => (
            <li key={bounty.id}>
              <Link
                href={`/bounties/${bounty.id}`}
                className="block bg-white shadow-xs rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {bounty.category && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          {bounty.category}
                        </span>
                      )}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${getBountyStatusColor(bounty.status)}`}
                      >
                        {bounty.status}
                      </span>
                      {bounty.organizationType && (
                        <span className="text-xs text-gray-500">
                          {getOrgTypeLabel(bounty.organizationType)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {bounty.title}
                    </h3>
                    <p className="text-gray-600 mt-1 line-clamp-2 text-sm">
                      {bounty.problemStatement}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        {bounty.proposalCount || 0} proposal
                        {bounty.proposalCount !== 1 ? "s" : ""}
                      </span>
                      <span>{bounty.viewCount || 0} views</span>
                      {bounty.organizationName && !bounty.isAnonymous && (
                        <span>{bounty.organizationName}</span>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-green-600 text-xl tabular-nums shrink-0">
                    {formatBountyAmount(bounty.bountyAmount)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
