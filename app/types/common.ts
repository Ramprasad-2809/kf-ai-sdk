/**
 * Sort direction for list queries
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort configuration for a single field
 */
export interface SortOption {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Filter criteria as key-value pairs
 */
export type Filter = Record<string, any>;

/**
 * Sort configuration: array of sort options
 */
export type Sort = SortOption[];

/**
 * Standard paginated list response
 * @template T - Type of items in the list
 */
export interface ListResponse<T> {
  /** Array of items for current page */
  Data: T[];

  /** Filter response */
  Filter?: Filter;

  /** Current page size */
  PageSize?: number;

  /** Sort configuration */
  Sort?: Sort;
}

/**
 * Options for list queries
 */
export interface ListOptions {
  /** Filter criteria as key-value pairs */
  Filter?: Filter;

  /** Sort configuration: field -> direction */
  Sort?: Sort;

  /** Page number (1-indexed) */
  PageNumber?: number;

  /** Current page size */
  PageSize?: number;

  /** Search query string */
  q?: string;
}