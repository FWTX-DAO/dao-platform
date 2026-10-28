export type CsvValue = string | number | boolean | Date | null | undefined;

// Cells starting with these can run as formulas in Excel/Sheets (CSV injection).
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: CsvValue | readonly string[]): string {
  if (value === null || value === undefined) return "";
  let text = Array.isArray(value)
    ? value.join("; ")
    : value instanceof Date
      ? value.toISOString()
      : String(value);
  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue | readonly string[];
}

/** RFC 4180 CSV with a UTF-8 BOM so Excel keeps accented names intact. */
export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const lines = [
    columns.map((column) => escapeCsvCell(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCsvCell(column.value(row))).join(","),
    ),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}
