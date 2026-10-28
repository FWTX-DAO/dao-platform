"use client";

import {
  columnVisibilityFeature,
  createColumnHelper,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  type ColumnVisibilityState,
} from "@tanstack/react-table";
import {
  TALENT_OPTION_LABELS,
  type TalentProfile,
} from "@services/talent/types";
import {
  formatTalentDate,
  safeHttpUrl,
  TalentStatusBadge,
} from "./talent-format";

export interface TalentColumnMeta {
  /** Name shown in the column visibility menu. */
  label: string;
  /** Applied to both the header and body cells (widths, wrapping). */
  className?: string;
  /** Applied to body cells only. */
  cellClassName?: string;
}

export interface TalentTableMeta {
  onSelect: (profile: TalentProfile) => void;
}

// Sorting and pagination run on the server; only state lives in the table.
export const talentTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  tableMeta: metaHelper<TalentTableMeta>(),
  columnMeta: metaHelper<TalentColumnMeta>(),
});

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityState = {
  phone: false,
  opportunityInterests: false,
  workPreferences: false,
  updatedAt: false,
};

const MAX_CHIPS = 3;

function Chips({ values }: { values: string[] }) {
  const extra = values.length - MAX_CHIPS;
  return (
    <ul className="flex flex-wrap gap-1">
      {values.slice(0, MAX_CHIPS).map((value) => (
        <li
          key={value}
          className="px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700 truncate max-w-[9rem]"
        >
          {TALENT_OPTION_LABELS[value] ?? value}
        </li>
      ))}
      {extra > 0 && (
        <li className="px-1 py-0.5 text-xs text-gray-400">+{extra}</li>
      )}
    </ul>
  );
}

function ClampedText({ value }: { value: string | null }) {
  return value ? (
    <span className="line-clamp-2 text-sm text-gray-700">{value}</span>
  ) : (
    <span className="text-sm text-gray-400">—</span>
  );
}

const helper = createColumnHelper<typeof talentTableFeatures, TalentProfile>();

export const talentColumns = helper.columns([
  helper.accessor("fullName", {
    header: "Name",
    enableHiding: false,
    meta: { label: "Name", className: "min-w-[14rem] max-w-[18rem]" },
    cell: ({ row, table }) => (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            table.options.meta?.onSelect(row.original);
          }}
          className="text-left font-medium text-gray-900 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden rounded-sm"
        >
          {row.original.fullName}
        </button>
        <p className="text-xs text-gray-500 truncate">{row.original.email}</p>
      </>
    ),
  }),
  helper.accessor("phone", {
    header: "Phone",
    enableSorting: false,
    meta: { label: "Phone", className: "whitespace-nowrap" },
    cell: ({ getValue }) => <ClampedText value={getValue()} />,
  }),
  helper.accessor("location", {
    header: "Location",
    meta: { label: "Location", className: "min-w-[9rem] max-w-[12rem]" },
    cell: ({ getValue }) => <ClampedText value={getValue()} />,
  }),
  helper.accessor("currentWork", {
    header: "Current work",
    enableSorting: false,
    meta: { label: "Current work", className: "min-w-[12rem] max-w-[16rem]" },
    cell: ({ getValue }) => <ClampedText value={getValue()} />,
  }),
  helper.accessor("skills", {
    header: "Skills",
    enableSorting: false,
    meta: { label: "Skills", className: "min-w-[10rem] max-w-[15rem]" },
    cell: ({ getValue }) => <Chips values={getValue()} />,
  }),
  helper.accessor("opportunityInterests", {
    header: "Open to",
    enableSorting: false,
    meta: { label: "Open to", className: "min-w-[10rem]" },
    cell: ({ getValue }) => <Chips values={getValue()} />,
  }),
  helper.accessor("workPreferences", {
    header: "Work style",
    enableSorting: false,
    meta: { label: "Work style", className: "min-w-[9rem]" },
    cell: ({ getValue }) => <Chips values={getValue()} />,
  }),
  helper.display({
    id: "links",
    header: "Links",
    meta: { label: "Links", className: "whitespace-nowrap" },
    cell: ({ row }) => {
      const p = row.original;
      const links = [
        { label: "GitHub", href: safeHttpUrl(p.githubUrl) },
        { label: "LinkedIn", href: safeHttpUrl(p.linkedinUrl) },
        { label: "Portfolio", href: safeHttpUrl(p.portfolioUrl) },
      ].filter((link) => link.href);
      if (links.length === 0)
        return <span className="text-sm text-gray-400">—</span>;
      return (
        <div className="flex gap-2 text-xs">
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href!}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-violet-700 hover:underline"
            >
              {label}
            </a>
          ))}
        </div>
      );
    },
  }),
  helper.accessor("status", {
    header: "Status",
    meta: { label: "Status" },
    cell: ({ getValue }) => <TalentStatusBadge status={getValue()} />,
  }),
  helper.accessor("createdAt", {
    header: "Submitted",
    sortDescFirst: true,
    meta: {
      label: "Submitted",
      className: "whitespace-nowrap",
      cellClassName: "tabular-nums text-sm text-gray-500",
    },
    cell: ({ getValue }) => formatTalentDate(getValue()),
  }),
  helper.accessor("updatedAt", {
    header: "Updated",
    sortDescFirst: true,
    meta: {
      label: "Updated",
      className: "whitespace-nowrap",
      cellClassName: "tabular-nums text-sm text-gray-500",
    },
    cell: ({ getValue }) => formatTalentDate(getValue()),
  }),
]);
