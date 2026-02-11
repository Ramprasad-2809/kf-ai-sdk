// ============================================================
// EXPRESSION ENGINE BUILT-IN FUNCTIONS
// Functions supported by backend expression evaluator
// ============================================================

/**
 * Built-in functions for expression evaluation.
 *
 * These functions match the backend's supported function set.
 * Each function handles null/undefined gracefully.
 *
 * Categories:
 * - String (7): CONCAT, UPPER, LOWER, TRIM, LENGTH, SUBSTRING, REPLACE
 * - Math (8): SUM, AVG, MIN, MAX, ABS, ROUND, FLOOR, CEIL
 * - Date (6): YEAR, MONTH, DAY, DATE_DIFF, ADD_DAYS, ADD_MONTHS
 * - Conditional (1): IF
 * - System (1): UUID
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FUNCTIONS: Record<string, (...args: any[]) => any> = {
  // ============================================================
  // STRING FUNCTIONS (7)
  // ============================================================

  /**
   * Concatenate multiple values into a single string
   * @example CONCAT("Hello", " ", "World") => "Hello World"
   */
  CONCAT: (...args: unknown[]): string =>
    args.map((a) => String(a ?? "")).join(""),

  /**
   * Convert string to uppercase
   * @example UPPER("hello") => "HELLO"
   */
  UPPER: (str: unknown): string => String(str ?? "").toUpperCase(),

  /**
   * Convert string to lowercase
   * @example LOWER("HELLO") => "hello"
   */
  LOWER: (str: unknown): string => String(str ?? "").toLowerCase(),

  /**
   * Remove leading and trailing whitespace
   * @example TRIM("  hello  ") => "hello"
   */
  TRIM: (str: unknown): string => String(str ?? "").trim(),

  /**
   * Get the length of a string
   * @example LENGTH("hello") => 5
   */
  LENGTH: (str: unknown): number => String(str ?? "").length,

  /**
   * Extract a substring
   * @param str - Source string
   * @param start - Starting index (0-based)
   * @param len - Optional length of substring
   * @example SUBSTRING("hello", 1, 3) => "ell"
   */
  SUBSTRING: (str: unknown, start: number, len?: number): string =>
    String(str ?? "").substring(
      start,
      len !== undefined ? start + len : undefined
    ),

  /**
   * Replace occurrences of a substring
   * @example REPLACE("hello", "l", "L") => "heLlo" (first occurrence only)
   */
  REPLACE: (str: unknown, search: string, replace: string): string =>
    String(str ?? "").replace(search, replace),

  // ============================================================
  // MATH FUNCTIONS (8)
  // ============================================================

  /**
   * Sum all numeric arguments
   * @example SUM(1, 2, 3) => 6
   */
  SUM: (...args: unknown[]): number =>
    args.reduce<number>((sum, val) => sum + (Number(val) || 0), 0),

  /**
   * Calculate average of numeric arguments
   * @example AVG(1, 2, 3) => 2
   */
  AVG: (...args: unknown[]): number => {
    const nums = args.filter((v) => v !== null && v !== undefined && !isNaN(Number(v)));
    if (nums.length === 0) return 0;
    return nums.reduce<number>((s, v) => s + Number(v), 0) / nums.length;
  },

  /**
   * Get minimum value
   * @example MIN(1, 2, 3) => 1
   */
  MIN: (...args: unknown[]): number => {
    const nums = args
      .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
      .map((v) => Number(v));
    if (nums.length === 0) return 0;
    return Math.min(...nums);
  },

  /**
   * Get maximum value
   * @example MAX(1, 2, 3) => 3
   */
  MAX: (...args: unknown[]): number => {
    const nums = args
      .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)))
      .map((v) => Number(v));
    if (nums.length === 0) return 0;
    return Math.max(...nums);
  },

  /**
   * Get absolute value
   * @example ABS(-5) => 5
   */
  ABS: (num: unknown): number => Math.abs(Number(num) || 0),

  /**
   * Round to nearest integer
   * @example ROUND(1.5) => 2
   */
  ROUND: (num: unknown): number => Math.round(Number(num) || 0),

  /**
   * Round down to nearest integer
   * @example FLOOR(1.9) => 1
   */
  FLOOR: (num: unknown): number => Math.floor(Number(num) || 0),

  /**
   * Round up to nearest integer
   * @example CEIL(1.1) => 2
   */
  CEIL: (num: unknown): number => Math.ceil(Number(num) || 0),

  // ============================================================
  // DATE FUNCTIONS (6)
  // ============================================================

  /**
   * Extract year from date
   * @example YEAR("2024-01-15") => 2024
   */
  YEAR: (date: unknown): number => {
    const d = new Date(date as string | number | Date);
    return isNaN(d.getTime()) ? 0 : d.getFullYear();
  },

  /**
   * Extract month from date (1-12)
   * @example MONTH("2024-01-15") => 1
   */
  MONTH: (date: unknown): number => {
    const d = new Date(date as string | number | Date);
    return isNaN(d.getTime()) ? 0 : d.getMonth() + 1;
  },

  /**
   * Extract day of month from date (1-31)
   * @example DAY("2024-01-15") => 15
   */
  DAY: (date: unknown): number => {
    const d = new Date(date as string | number | Date);
    return isNaN(d.getTime()) ? 0 : d.getDate();
  },

  /**
   * Calculate difference in days between two dates
   * @example DATE_DIFF("2024-01-15", "2024-01-10") => 5
   */
  DATE_DIFF: (d1: unknown, d2: unknown): number => {
    const date1 = new Date(d1 as string | number | Date);
    const date2 = new Date(d2 as string | number | Date);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * Add days to a date
   * @example ADD_DAYS("2024-01-15", 5) => Date("2024-01-20")
   */
  ADD_DAYS: (date: unknown, days: number): Date => {
    const result = new Date(date as string | number | Date);
    if (isNaN(result.getTime())) return new Date(NaN);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Add months to a date
   * @example ADD_MONTHS("2024-01-15", 2) => Date("2024-03-15")
   */
  ADD_MONTHS: (date: unknown, months: number): Date => {
    const result = new Date(date as string | number | Date);
    if (isNaN(result.getTime())) return new Date(NaN);
    result.setMonth(result.getMonth() + months);
    return result;
  },

  // ============================================================
  // CONDITIONAL FUNCTIONS (1)
  // ============================================================

  /**
   * Return value based on condition
   * @example IF(true, "yes", "no") => "yes"
   */
  IF: <T, F>(condition: unknown, trueVal: T, falseVal: F): T | F =>
    condition ? trueVal : falseVal,

  // ============================================================
  // SYSTEM FUNCTIONS (1)
  // ============================================================

  /**
   * Generate a UUID v4
   * @example UUID() => "550e8400-e29b-41d4-a716-446655440000"
   */
  UUID: (): string => {
    // Use crypto.randomUUID if available (modern browsers/Node.js)
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older environments
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};
