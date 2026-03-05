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

export function BountiesClient() {
  const [statusFilter, setStatusFilter] = useState<string>("published");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: bounties = [], isLoading } = useBounties({
    status: statusFilter,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    search: search || undefined,
  });
  const { can } = useEntitlements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Innovation Bounties
          </h1>
          <p className="text-gray-600 mt-1">
            Browse funded opportunities to contribute to Fort Worth civic
            innovation
          </p>
        </div>
        <div className="flex gap-2">
          <UpgradeCTA allowed={can.submitBounty} feature="submit bounties">
            <Link
              href="/bounties/submit"
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm"
            >
              Submit Bounty
            </Link>
          </UpgradeCTA>
          <Link
            href="/bounties/my-bounties"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            My Bounties
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search bounties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden w-64"
        />
        <div className="flex gap-1">
          {BOUNTY_STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                statusFilter === s
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-md focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
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

      {isLoading ? (
        <div className="py-8 text-center text-gray-500">
          Loading bounties{"\u2026"}
        </div>
      ) : bounties.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No bounties match your filters.
        </div>
      ) : (
        <div className="space-y-4">
          {bounties.map((bounty: any) => (
            <Link
              key={bounty.id}
              href={`/bounties/${bounty.id}`}
              className="block bg-white shadow-sm rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {bounty.category && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {bounty.category}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getBountyStatusColor(bounty.status)}`}
                    >
                      {bounty.status}
                    </span>
                    {bounty.organizationType && (
                      <span className="text-xs text-gray-500">
                        {getOrgTypeLabel(bounty.organizationType)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {bounty.title}
                  </h3>
                  <p className="text-gray-600 mt-1 line-clamp-2">
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
                <div className="text-right ml-4">
                  <p className="font-bold text-green-600 text-xl tabular-nums">
                    {formatBountyAmount(bounty.bountyAmount)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
