"use client";

import { useState, useMemo, useCallback } from "react";
import { useMembers, type Member } from "@hooks/useMembers";
import { MemberCard } from "@components/MemberCard";
import { MemberDetailSheet } from "@components/MemberDetailSheet";
import { PageHeader } from "@components/ui/page-header";
import { SearchInput } from "@components/ui/search-input";
import { FilterPills } from "@components/ui/filter-pills";
import { EmptyState } from "@components/ui/empty-state";
import { ErrorState } from "@components/ui/error-state";
import { SkeletonGrid } from "@components/ui/skeleton";
import { Users } from "lucide-react";

const STANDING_FILTERS = ["all", "members", "observers"] as const;
type StandingFilter = (typeof STANDING_FILTERS)[number];

const STANDING_LABELS: Record<StandingFilter, string> = {
  all: "All",
  members: "Members",
  observers: "Observers",
};

export default function MembersPage() {
  const { data: members = [], isLoading, isError, refetch } = useMembers();
  const [search, setSearch] = useState("");
  const [standingFilter, setStandingFilter] = useState<StandingFilter>("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filtered = useMemo(() => {
    let result = members as Member[];

    // Standing filter
    if (standingFilter === "members") {
      result = result.filter(
        (m) => m.standingTier === "monthly" || m.standingTier === "annual",
      );
    } else if (standingFilter === "observers") {
      result = result.filter(
        (m) => m.standingTier === "free" || !m.standingTier,
      );
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.username?.toLowerCase().includes(q) ||
          m.firstName?.toLowerCase().includes(q) ||
          m.lastName?.toLowerCase().includes(q) ||
          m.jobTitle?.toLowerCase().includes(q) ||
          m.employer?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q) ||
          m.industry?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [members, search, standingFilter]);

  const handleCardClick = useCallback((member: Member) => {
    setSelectedMember(member);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStandingFilter("all");
  }, []);

  const hasActiveFilters = search || standingFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        subtitle="Browse and connect with DAO community members"
      >
        {members.length > 0 && (
          <span className="text-sm text-gray-500 tabular-nums">
            {members.length} members
          </span>
        )}
      </PageHeader>

      {/* Search + Filters */}
      {members.length > 0 && (
        <div className="space-y-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, role, location, skills..."
            className="w-full sm:w-80"
            aria-label="Search members"
          />
          <FilterPills
            options={STANDING_FILTERS}
            value={standingFilter}
            onChange={setStandingFilter}
            labelFn={(v) => STANDING_LABELS[v]}
            ariaLabel="Filter by membership standing"
          />
        </div>
      )}

      {/* Content */}
      {isError ? (
        <ErrorState title="Failed to load members" onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonGrid count={6} cols={3} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No members yet"
          description="Members will appear here once they join the DAO."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No members match your search"
          action={
            hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((member) => (
            <li key={member.id}>
              <MemberCard
                member={member}
                onClick={() => handleCardClick(member)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Detail Sheet */}
      <MemberDetailSheet
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      />
    </div>
  );
}
