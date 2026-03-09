/**
 * Format a date string for display
 */
export const formatDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "Unknown date";
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
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
export const formatDateShort = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "Unknown date";
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-us", {
      year: "numeric",
      month: "short",
    });
  } catch {
    return "Unknown date";
  }
};
