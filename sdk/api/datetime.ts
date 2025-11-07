import type { DateTimeEncoded, DateEncoded } from '../types/common';

/**
 * Utility functions for datetime encoding/decoding
 */

/**
 * Encode a Date object to API datetime format
 */
export function encodeDatetime(date: Date): DateTimeEncoded {
  return { $__dt__: date.getTime() / 1000 };
}

/**
 * Decode API datetime format to Date object
 */
export function decodeDatetime(encoded: DateTimeEncoded): Date {
  return new Date(encoded.$__dt__ * 1000);
}

/**
 * Encode a Date object to API date format (YYYY-MM-DD)
 */
export function encodeDate(date: Date): DateEncoded {
  return { $__d__: date.toISOString().split('T')[0] };
}

/**
 * Decode API date format to Date object
 */
export function decodeDate(encoded: DateEncoded): Date {
  return new Date(encoded.$__d__);
}