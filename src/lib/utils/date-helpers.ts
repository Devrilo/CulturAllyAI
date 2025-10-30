/**
 * Date utility functions for form handling
 */

/**
 * Converts ISO datetime string to date-only format (YYYY-MM-DD)
 * @param isoDateTime - ISO 8601 datetime string (e.g., "2024-12-25T00:00:00.000Z")
 * @returns Date-only string (e.g., "2024-12-25") or empty string if input is empty
 */
export function fromISODateTime(isoDateTime: string): string {
  if (!isoDateTime) return "";
  return isoDateTime.split("T")[0];
}

/**
 * Converts date-only format to ISO datetime string
 * @param dateOnly - Date-only string (e.g., "2024-12-25")
 * @returns ISO 8601 datetime string (e.g., "2024-12-25T00:00:00.000Z") or empty string if input is empty
 */
export function toISODateTime(dateOnly: string): string {
  if (!dateOnly) return "";
  return `${dateOnly}T00:00:00.000Z`;
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date string (e.g., "2024-12-25")
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}
