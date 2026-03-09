/**
 * Format a date string for display
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-us", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Unknown date";
  }
};

/**
 * Format a date string as short (month + year only)
 */
export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) return "Unknown date";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-us", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return "Unknown date";
  }
};
