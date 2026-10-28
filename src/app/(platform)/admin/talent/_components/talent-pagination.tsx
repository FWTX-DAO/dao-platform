"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { TALENT_PAGE_SIZES } from "@services/talent/types";

const BUTTON_CLASS =
  "inline-flex items-center justify-center h-9 min-w-9 px-2 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden";

interface TalentPaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total: number;
  loading: boolean;
  canPrevious: boolean;
  canNext: boolean;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onPageSizeChange: (size: number) => void;
}

export function TalentPagination({
  pageIndex,
  pageSize,
  pageCount,
  total,
  loading,
  canPrevious,
  canNext,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onPageSizeChange,
}: TalentPaginationProps) {
  const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <nav
      aria-label="Talent pagination"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600"
    >
      <div className="flex items-center gap-4">
        <p className="tabular-nums" aria-live="polite">
          {loading ? "Loading…" : `${rangeStart}–${rangeEnd} of ${total}`}
        </p>
        <label className="flex items-center gap-2">
          <span className="text-gray-500">Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
          >
            {TALENT_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onFirst}
          disabled={!canPrevious}
          aria-label="First page"
          className={BUTTON_CLASS}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canPrevious}
          aria-label="Previous page"
          className={BUTTON_CLASS}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="tabular-nums px-2">
          Page {pageIndex + 1} of {Math.max(1, pageCount)}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next page"
          className={BUTTON_CLASS}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onLast}
          disabled={!canNext}
          aria-label="Last page"
          className={BUTTON_CLASS}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
