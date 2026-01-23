import type { DateEncodedType, DateTimeEncodedType } from "../types/base-fields";

/**
 * Date format constants matching backend DatetimeFormat class
 * Source: kf-ai-base/core/util/datetime_utils.py
 */
export const DatetimeFormat = {
  /** Date format: "YYYY-MM-DD" */
  DATE: "%Y-%m-%d",
  /** Time format: "HH:MM:SS" */
  TIME: "%H:%M:%S",
  /** DateTime format: "YYYY-MM-DD HH:MM:SS" */
  DATE_TIME: "%Y-%m-%d %H:%M:%S",
} as const;

// ============================================================
// DECODING FUNCTIONS (API Response → Date object)
// Use these in components to convert API response to Date
// ============================================================

/**
 * Decode API date response to Date object
 * @param encoded - API response format { "$__d__": "YYYY-MM-DD" }
 * @returns JavaScript Date object
 *
 * @example
 * const apiResponse = { "$__d__": "2025-03-15" };
 * const date = decodeDate(apiResponse); // => Date object
 */
export function decodeDate(encoded: DateEncodedType): Date {
  const [year, month, day] = encoded.$__d__.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Decode API datetime response to Date object
 * @param encoded - API response format { "$__dt__": unix_timestamp_seconds }
 * @returns JavaScript Date object
 *
 * @example
 * const apiResponse = { "$__dt__": 1769110463 };
 * const date = decodeDateTime(apiResponse); // => Date object
 */
export function decodeDateTime(encoded: DateTimeEncodedType): Date {
  return new Date(encoded.$__dt__ * 1000);
}

// ============================================================
// FORMATTING FUNCTIONS (Date object → API Request string)
// Use these when creating/updating records
// ============================================================

/**
 * Format a Date object to API request date string
 * @param date - JavaScript Date object
 * @returns "YYYY-MM-DD" formatted string for API requests
 *
 * @example
 * formatDate(new Date(2025, 2, 15)) // => "2025-03-15"
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to API request datetime string
 * @param date - JavaScript Date object
 * @returns "YYYY-MM-DD HH:MM:SS" formatted string for API requests
 *
 * @example
 * formatDateTime(new Date(2025, 2, 15, 10, 30, 45)) // => "2025-03-15 10:30:45"
 */
export function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// ============================================================
// PARSING FUNCTIONS (String → Date object)
// Use these when you have a date string and need a Date object
// ============================================================

/**
 * Parse date string to Date object
 * @param dateStr - "YYYY-MM-DD" formatted string
 * @returns JavaScript Date object
 *
 * @example
 * parseDate("2025-03-15") // => Date object for March 15, 2025
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Parse datetime string to Date object
 * @param dateTimeStr - "YYYY-MM-DD HH:MM:SS" formatted string
 * @returns JavaScript Date object
 *
 * @example
 * parseDateTime("2025-03-15 10:30:45") // => Date object
 */
export function parseDateTime(dateTimeStr: string): Date {
  const [datePart, timePart] = dateTimeStr.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
