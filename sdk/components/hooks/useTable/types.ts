import type { ListResponseType, ConditionGroupOperatorType } from "../../../types/common";
import type { ConditionType, ConditionGroupType, UseFilterReturnType } from "../useFilter";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ColumnDefinitionType<T> {
  /** Field name from the data type */
  fieldId: keyof T;
  /** Display label (optional, defaults to fieldId) */
  label?: string;
  /** Enable sorting for this column */
  enableSorting?: boolean;
  /** Enable filtering for this column */
  enableFiltering?: boolean;
  /** Custom transform function (overrides auto-formatting) */
  transform?: (value: any, row: T) => React.ReactNode;
}

export interface UseTableOptionsType<T> {
  /** Data source identifier */
  source: string;
  /** Column configurations */
  columns: ColumnDefinitionType<T>[];
  /** Enable sorting functionality */
  enableSorting?: boolean;
  /** Enable filtering functionality */
  enableFiltering?: boolean;
  /** Enable pagination */
  enablePagination?: boolean;
  /** Initial state */
  initialState?: {
    pagination?: {
      pageNo: number;
      pageSize: number;
    };
    sorting?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
    filters?: Array<ConditionType | ConditionGroupType>;
    filterOperator?: ConditionGroupOperatorType;
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
  filter: UseFilterReturnType;

  // Pagination (Flat Access)
  pagination: {
    currentPage: number;
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
