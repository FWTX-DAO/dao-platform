"use client";

import { useCallback, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, UserSearch } from "lucide-react";
import {
  useTable,
  type ColumnVisibilityState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useTalentProfiles } from "@hooks/useTalent";
import {
  TALENT_PAGE_SIZE,
  type OpportunityInterest,
  type TalentFilters,
  type TalentProfile,
  type TalentSortColumn,
  type TalentStatusFilter,
  type WorkPreference,
} from "@services/talent/types";
import { talentFiltersToSearchParams } from "@services/talent/services/talent-query";
import { PageHeader } from "@components/ui/page-header";
import { EmptyState } from "@components/ui/empty-state";
import { ErrorState } from "@components/ui/error-state";
import { Skeleton } from "@components/ui/skeleton";
import { cn } from "@utils/cn";
import {
  DEFAULT_COLUMN_VISIBILITY,
  talentColumns,
  talentTableFeatures,
} from "./_components/talent-columns";
import { TalentDetailSheet } from "./_components/talent-detail-sheet";
import { TalentPagination } from "./_components/talent-pagination";
import { TalentToolbar } from "./_components/talent-toolbar";

// Stable fallbacks: a fresh [] each render would invalidate the row model.
const NO_ROWS: TalentProfile[] = [];
const DEFAULT_SORTING: SortingState = [{ id: "createdAt", desc: true }];
const FIRST_PAGE: PaginationState = {
  pageIndex: 0,
  pageSize: TALENT_PAGE_SIZE,
};

export default function AdminTalentPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TalentStatusFilter>("all");
  const [interests, setInterests] = useState<OpportunityInterest[]>([]);
  const [preferences, setPreferences] = useState<WorkPreference[]>([]);
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING);
  const [pagination, setPagination] = useState<PaginationState>(FIRST_PAGE);
  const [columnVisibility, setColumnVisibility] =
    useState<ColumnVisibilityState>(DEFAULT_COLUMN_VISIBILITY);
  const [selected, setSelected] = useState<TalentProfile | null>(null);

  const sort = sorting[0];
  const filters: TalentFilters = {
    search,
    status,
    interests,
    preferences,
    ...(sort && {
      sort: sort.id as TalentSortColumn,
      dir: sort.desc ? "desc" : "asc",
    }),
  };

  const { data, isLoading, isError, isPlaceholderData, refetch } =
    useTalentProfiles({
      ...filters,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    });

  // Any change to what is being matched or its order starts at page one.
  const resetPage = useCallback(
    () => setPagination((p) => ({ ...p, pageIndex: 0 })),
    [],
  );
  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting(updater);
      resetPage();
    },
    [resetPage],
  );
  const withPageReset = useCallback(
    <T,>(setter: (value: T) => void) =>
      (value: T) => {
        setter(value);
        resetPage();
      },
    [resetPage],
  );
  const handleReset = useCallback(() => {
    setSearch("");
    setStatus("all");
    setInterests([]);
    setPreferences([]);
    resetPage();
  }, [resetPage]);

  const table = useTable({
    features: talentTableFeatures,
    columns: talentColumns,
    data: data?.items ?? NO_ROWS,
    rowCount: data?.total ?? 0,
    getRowId: (row) => row.id,
    state: { sorting, pagination, columnVisibility },
    onSortingChange: handleSortingChange,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    manualSorting: true,
    manualPagination: true,
    enableMultiSort: false,
    enableSortingRemoval: false,
    meta: { onSelect: setSelected },
  });

  // Step back if the current page no longer exists (e.g. rows were archived).
  if (data && pagination.pageIndex >= data.totalPages)
    setPagination((p) => ({ ...p, pageIndex: data.totalPages - 1 }));

  const hasActiveFilters =
    search !== "" ||
    status !== "all" ||
    interests.length > 0 ||
    preferences.length > 0;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talent Network"
        subtitle="Search, filter, and export talent.fwtx.city questionnaire submissions"
      />

      <TalentToolbar
        search={search}
        onSearchChange={withPageReset(setSearch)}
        status={status}
        onStatusChange={withPageReset(setStatus)}
        interests={interests}
        onInterestsChange={withPageReset(setInterests)}
        preferences={preferences}
        onPreferencesChange={withPageReset(setPreferences)}
        hasActiveFilters={hasActiveFilters}
        onReset={handleReset}
        columns={table.getAllLeafColumns()}
        exportHref={`/api/admin/talent/export?${talentFiltersToSearchParams(filters)}`}
        exportCount={data?.total}
      />

      {isError ? (
        <ErrorState
          title="Failed to load talent profiles"
          onRetry={() => refetch()}
        />
      ) : (
        <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => {
                      const sorted = header.column.getIsSorted();
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          aria-sort={
                            sorted === "asc"
                              ? "ascending"
                              : sorted === "desc"
                                ? "descending"
                                : undefined
                          }
                          className={cn(
                            "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500",
                            header.column.columnDef.meta?.className,
                          )}
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden rounded-sm"
                            >
                              <table.FlexRender header={header} />
                              {sorted === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                              )}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody
                aria-busy={isLoading || isPlaceholderData}
                className={cn(
                  "divide-y divide-gray-100 transition-opacity",
                  isPlaceholderData && "opacity-60",
                )}
              >
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} aria-hidden="true">
                      {Array.from({ length: visibleColumnCount }).map(
                        (_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full min-w-16" />
                          </td>
                        ),
                      )}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnCount}>
                      {hasActiveFilters ? (
                        <EmptyState
                          title="No profiles match these filters"
                          action={
                            <button
                              type="button"
                              onClick={handleReset}
                              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
                            >
                              Reset filters
                            </button>
                          }
                        />
                      ) : (
                        <EmptyState
                          icon={<UserSearch />}
                          title="No talent profiles yet"
                          description="Submissions from talent.fwtx.city will appear here."
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.original)}
                      className="cursor-pointer hover:bg-violet-50/50 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta;
                        return (
                          <td
                            key={cell.id}
                            className={cn(
                              "px-4 py-3 align-top",
                              meta?.className,
                              meta?.cellClassName,
                            )}
                          >
                            <table.FlexRender cell={cell} />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TalentPagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            pageCount={table.getPageCount()}
            total={data?.total ?? 0}
            loading={isLoading}
            canPrevious={table.getCanPreviousPage()}
            canNext={table.getCanNextPage() && !isPlaceholderData}
            onFirst={() => table.firstPage()}
            onPrevious={() => table.previousPage()}
            onNext={() => table.nextPage()}
            onLast={() => table.lastPage()}
            onPageSizeChange={(size) => table.setPageSize(size)}
          />
        </div>
      )}

      <TalentDetailSheet
        profile={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
