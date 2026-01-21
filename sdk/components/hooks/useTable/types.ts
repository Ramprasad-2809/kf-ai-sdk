import type { ListResponseType, SortType, ColumnDefinitionType } from "../../../types/common";

// Re-export ColumnDefinitionType for backwards compatibility
export type { ColumnDefinitionType };
import type { UseFilterReturnType, FilterStateType } from "../useFilter";

// ============================================================
// STATE TYPE DEFINITIONS
// ============================================================

/**
 * Pagination state type
 */
export interface PaginationStateType {
  /** Page number (1-indexed) */
  pageNo: number;
  /** Number of items per page */
  pageSize: number;
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface UseTableOptionsType<T> {
  /** Data source identifier */
  source: string;
  /** Column configurations */
  columns: ColumnDefinitionType<T>[];
  /** Initial state */
  initialState?: {
    /** Sort configuration: [{ "fieldName": "ASC" }] */
    sort?: SortType;
    /** Pagination state: { pageNo, pageSize } */
    pagination?: PaginationStateType;
    /** Filter state: { conditions, operator } */
    filter?: FilterStateType<T>;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: (data: T[]) => void;
}

export interface UseTableReturnType<T> {
  // Data
  rows: T[];
  totalItems: number;

  // Loading States
  isLoading: boolean;
  isFetching: boolean;

  // Error Handling
  error: Error | null;

  // Search (Flat Access)
  search: {
    query: string;
    setQuery: (value: string) => void;
    clear: () => void;
  };

  // Sorting (Flat Access)
  sort: {
    field: keyof T | null;
    direction: "asc" | "desc" | null;
    toggle: (field: keyof T) => void;
    clear: () => void;
    set: (field: keyof T, direction: "asc" | "desc") => void;
  };

  // Filter (Simplified chainable API)
  filter: UseFilterReturnType<T>;

  // Pagination (Flat Access)
  pagination: {
    pageNo: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    canGoNext: boolean;
    canGoPrevious: boolean;
    goToNext: () => void;
    goToPrevious: () => void;
    goToPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };

  // Operations
  refetch: () => Promise<ListResponseType<T>>;
}
