import { cn } from "@utils/cn";
import type { TalentStatus } from "@services/talent/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatTalentDate(value: Date | string, withTime = false) {
  const date = new Date(value);
  return (withTime ? dateTimeFormatter : dateFormatter).format(date);
}

/** Profiles come from a public form, so only http(s) URLs become links. */
export function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function TalentStatusBadge({ status }: { status: TalentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        status === "verified"
          ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20"
          : "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-500/20",
      )}
    >
      {status === "verified" ? "Verified" : "Archived"}
    </span>
  );
}
