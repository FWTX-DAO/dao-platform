"use client";

import { ChevronDown, Columns3, Download, X } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { SearchInput } from "@components/ui/search-input";
import {
  OPPORTUNITY_INTERESTS,
  TALENT_OPTION_LABELS,
  TALENT_STATUS_FILTERS,
  WORK_PREFERENCES,
  type OpportunityInterest,
  type TalentProfile,
  type TalentStatusFilter,
  type WorkPreference,
} from "@services/talent/types";
import { cn } from "@utils/cn";
import type { talentTableFeatures } from "./talent-columns";

const STATUS_LABELS: Record<TalentStatusFilter, string> = {
  all: "All statuses",
  verified: "Verified",
  archived: "Archived",
};

// The shared dropdown expects theme tokens this app does not define.
const MENU_CLASS = "bg-white border-gray-200 text-gray-900 shadow-lg min-w-48";
const ITEM_CLASS = "cursor-pointer data-highlighted:bg-gray-100";

function TriggerButton({
  label,
  count,
  active,
}: {
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <DropdownMenuTrigger
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden",
        active
          ? "border-violet-300 bg-violet-50 text-violet-800"
          : "border-dashed border-gray-300 text-gray-700 hover:bg-gray-50",
      )}
    >
      {label}
      {count ? (
        <span className="rounded-full bg-violet-600 px-1.5 text-xs text-white tabular-nums">
          {count}
        </span>
      ) : null}
      <ChevronDown className="h-4 w-4 opacity-60" />
    </DropdownMenuTrigger>
  );
}

function MultiSelectFilter<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <DropdownMenu>
      <TriggerButton
        label={label}
        count={value.length}
        active={value.length > 0}
      />
      <DropdownMenuContent align="start" className={MENU_CLASS}>
        <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
          Matches any selected
        </DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            className={ITEM_CLASS}
            checked={value.includes(option)}
            // Keep the menu open so several options can be toggled.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(
                options.filter((o) =>
                  o === option ? checked : value.includes(o),
                ),
              )
            }
          >
            {TALENT_OPTION_LABELS[option] ?? option}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-gray-100" />
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full rounded-xs px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100"
            >
              Clear
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TalentToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: TalentStatusFilter;
  onStatusChange: (value: TalentStatusFilter) => void;
  interests: OpportunityInterest[];
  onInterestsChange: (value: OpportunityInterest[]) => void;
  preferences: WorkPreference[];
  onPreferencesChange: (value: WorkPreference[]) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
  columns: Column<typeof talentTableFeatures, TalentProfile, unknown>[];
  exportHref: string;
  exportCount: number | undefined;
}

export function TalentToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  interests,
  onInterestsChange,
  preferences,
  onPreferencesChange,
  hasActiveFilters,
  onReset,
  columns,
  exportHref,
  exportCount,
}: TalentToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search name, email, phone, location, work, skills…"
          className="w-full sm:w-96"
          aria-label="Search talent profiles"
        />
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <TriggerButton
              label={STATUS_LABELS[status]}
              active={status !== "all"}
            />
            <DropdownMenuContent align="start" className={MENU_CLASS}>
              <DropdownMenuRadioGroup
                value={status}
                onValueChange={(v) => onStatusChange(v as TalentStatusFilter)}
              >
                {TALENT_STATUS_FILTERS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option}
                    value={option}
                    className={ITEM_CLASS}
                  >
                    {STATUS_LABELS[option]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <MultiSelectFilter
            label="Open to"
            options={OPPORTUNITY_INTERESTS}
            value={interests}
            onChange={onInterestsChange}
          />
          <MultiSelectFilter
            label="Work style"
            options={WORK_PREFERENCES}
            value={preferences}
            onChange={onPreferencesChange}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] rounded-md text-sm text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
            <Columns3 className="h-4 w-4" />
            Columns
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={MENU_CLASS}>
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
              Show columns
            </DropdownMenuLabel>
            {columns
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className={ITEM_CLASS}
                  checked={column.getIsVisible()}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) =>
                    column.toggleVisibility(checked)
                  }
                >
                  {column.columnDef.meta?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <a
          href={exportHref}
          download
          title="Download every profile matching the current filters"
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden",
            exportCount === 0 && "pointer-events-none opacity-50",
          )}
          aria-disabled={exportCount === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
          {exportCount !== undefined && (
            <span className="tabular-nums opacity-80">({exportCount})</span>
          )}
        </a>
      </div>
    </div>
  );
}
