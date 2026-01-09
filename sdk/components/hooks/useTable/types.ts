import type { ListResponse, LogicalOperator } from "../../../types/common";
import type {
  FilterConditionWithId,
  TypedFilterConditionInput,
  ValidationError,
  FieldDefinition,
} from "../useFilter";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ColumnDefinition<T> {
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

export interface UseTableOptions<T> {
  /** Data source identifier */
  source: string;
  /** Column configurations */
  columns: ColumnDefinition<T>[];
  /** Enable sorting functionality */
  enableSorting?: boolean;
  /** Enable filtering functionality */
  enableFiltering?: boolean;
  /** Enable pagination */
  enablePagination?: boolean;
  /** Field definitions for filter validation */
  fieldDefinitions?: Record<keyof T, FieldDefinition>;
  /** Initial state */
  initialState?: {
    pagination?: {
      pageNo: number; // 1-indexed page number
      pageSize: number;
    };
    sorting?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
    globalFilter?: string;
    filters?: FilterConditionWithId[];
    filterOperator?: LogicalOperator;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: (data: T[]) => void;
  /** Filter error callback */
  onFilterError?: (errors: ValidationError[]) => void;
}

export interface UseTableReturn<T> {
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

  // Legacy Global Filtering (Flat Access)
  globalFilter: {
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
  };

  // Advanced Filtering (Filter Conditions) - Type-safe: lhsField constrained to keyof T
  filter: {
    // State
    conditions: FilterConditionWithId[];
    logicalOperator: LogicalOperator;
    isValid: boolean;
    validationErrors: ValidationError[];
    hasConditions: boolean;

    // Condition Management (type-safe)
    addCondition: (condition: TypedFilterConditionInput<T>) => string;
    updateCondition: (
      id: string,
      updates: Partial<TypedFilterConditionInput<T>>
    ) => boolean;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    getCondition: (id: string) => FilterConditionWithId | undefined;

    // Logical Operator
    setLogicalOperator: (operator: LogicalOperator) => void;

    // Bulk Operations
    setConditions: (conditions: FilterConditionWithId[]) => void;
    replaceCondition: (
      id: string,
      newCondition: TypedFilterConditionInput<T>
    ) => boolean;

    // Validation
    validateCondition: (condition: Partial<FilterConditionWithId>) => any;
    validateAllConditions: () => any;

    // State Management
    exportState: () => any;
    importState: (state: any) => void;
    resetToInitial: () => void;

    // Utilities
    getConditionCount: () => number;
  };

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
  refetch: () => Promise<ListResponse<T>>;
}
