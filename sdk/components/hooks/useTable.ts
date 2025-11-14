import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import type { ListResponse, ListOptions } from "../../types/common";
import { useFilter } from "./useFilter";
import type {
  FilterConditionWithId,
  ValidationError,
  FieldDefinition,
} from "./useFilter";

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
    filterOperator?: "AND" | "OR";
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
  };

  // Legacy Global Filtering (Flat Access)
  globalFilter: {
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
  };

  // Advanced Filtering (Filter Conditions)
  filter: {
    // State
    conditions: FilterConditionWithId[];
    logicalOperator: "AND" | "OR";
    isValid: boolean;
    validationErrors: ValidationError[];
    hasConditions: boolean;

    // Condition Management
    addCondition: (
      condition: Omit<FilterConditionWithId, "id" | "isValid">
    ) => string;
    updateCondition: (
      id: string,
      updates: Partial<FilterConditionWithId>
    ) => boolean;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    getCondition: (id: string) => FilterConditionWithId | undefined;

    // Logical Operator
    setLogicalOperator: (operator: "AND" | "OR") => void;

    // Bulk Operations
    setConditions: (conditions: FilterConditionWithId[]) => void;
    replaceCondition: (
      id: string,
      newCondition: Omit<FilterConditionWithId, "id" | "isValid">
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

// ============================================================
// INTERNAL STATE TYPES
// ============================================================

interface SearchState {
  query: string;
}

interface SortingState<T> {
  field: keyof T | null;
  direction: "asc" | "desc" | null;
}

interface FilteringState {
  global: string;
}

interface PaginationState {
  pageNo: number; // 1-indexed page number
  pageSize: number;
}

// ============================================================
// FIELD TYPE DETECTION
// ============================================================

/**
 * Detect field type for auto-formatting
 * This will be enhanced with actual type introspection in the future
 * Currently unused but kept for future auto-formatting implementation
 */
// function _detectFieldType<T>(fieldId: keyof T): string {
//   const fieldName = String(fieldId);

//   // Basic pattern matching - will be replaced with actual type introspection
//   if (fieldName.includes('price') || fieldName.includes('cost') || fieldName.includes('amount')) {
//     return 'currency';
//   }
//   if (fieldName.includes('date') || fieldName.includes('At') || fieldName === 'created' || fieldName === 'updated') {
//     return 'datetime';
//   }
//   if (fieldName.includes('stock') || fieldName.includes('quantity') || fieldName.includes('count')) {
//     return 'number';
//   }
//   if (fieldName.includes('status') || fieldName.includes('type') || fieldName.includes('category')) {
//     return 'string';
//   }

//   return 'string'; // default
// }

// ============================================================
// MAIN HOOK
// ============================================================

export function useTable<T = any>(
  options: UseTableOptions<T>
): UseTableReturn<T> {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [search, setSearch] = useState<SearchState>({
    query: "",
  });

  const [sorting, setSorting] = useState<SortingState<T>>({
    field: options.initialState?.sorting?.field || null,
    direction: options.initialState?.sorting?.direction || null,
  });

  const [filtering, setFiltering] = useState<FilteringState>({
    global: options.initialState?.globalFilter || "",
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pageNo: options.initialState?.pagination?.pageNo || 1, // Start at page 1
    pageSize: options.initialState?.pagination?.pageSize || 10,
  });

  // ============================================================
  // FILTER HOOK INTEGRATION
  // ============================================================

  const filterHook = useFilter<T>({
    initialConditions: options.initialState?.filters,
    initialLogicalOperator: options.initialState?.filterOperator || "AND",
    fieldDefinitions: options.fieldDefinitions,
    validateOnChange: true,
    onValidationError: options.onFilterError,
    onConditionAdd: () => {
      // Reset to first page when adding filters
      setPagination((prev) => ({ ...prev, pageNo: 1 }));
    },
    onConditionUpdate: () => {
      // Reset to first page when updating filters
      setPagination((prev) => ({ ...prev, pageNo: 1 }));
    },
    onConditionRemove: () => {
      // Reset to first page when removing filters
      setPagination((prev) => ({ ...prev, pageNo: 1 }));
    },
  });

  // ============================================================
  // API OPTIONS BUILDER
  // ============================================================

  const apiOptions = useMemo((): ListOptions => {
    const opts: ListOptions = {};

    // Add sorting
    if (sorting.field && sorting.direction) {
      opts.Sort = [
        {
          Field: String(sorting.field),
          Order: sorting.direction === "asc" ? "ASC" : "DESC",
        },
      ];
    }

    // Add search query (separate from filters)
    if (search.query) {
      opts.Search = search.query;
    }

    // Add filter conditions
    if (filterHook.filterPayload) {
      opts.Filter = filterHook.filterPayload;
    }

    // Add pagination
    if (options.enablePagination) {
      opts.Page = pagination.pageNo; // Already 1-indexed
      opts.PageSize = pagination.pageSize;
    }

    return opts;
  }, [
    sorting,
    search.query,
    filterHook.filterPayload,
    pagination,
    options.enablePagination,
  ]);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ["table", options.source, apiOptions],
    queryFn: async (): Promise<ListResponse<T>> => {
      try {
        const response = await api<T>(options.source).list(apiOptions);
        if (options.onSuccess) {
          options.onSuccess(response.Data);
        }
        return response;
      } catch (err) {
        if (options.onError) {
          options.onError(err as Error);
        }
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Count query for accurate total items
  const {
    data: countData,
    isLoading: isCountLoading,
    isFetching: isCountFetching,
    error: countError,
    refetch: countRefetch,
  } = useQuery({
    queryKey: ["table-count", options.source, apiOptions],
    queryFn: async () => {
      try {
        return await api<T>(options.source).count(apiOptions);
      } catch (err) {
        if (options.onError) {
          options.onError(err as Error);
        }
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 0,
  });

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const rows = useMemo(() => data?.Data || [], [data]);
  const totalItems = useMemo(() => countData?.Count || 0, [countData]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pagination.pageSize);
  }, [totalItems, pagination.pageSize]);

  // ============================================================
  // SORTING OPERATIONS
  // ============================================================

  const toggleSort = useCallback((field: keyof T) => {
    setSorting((prev) => {
      if (prev.field === field) {
        // Same field - toggle direction or clear
        if (prev.direction === "asc") {
          return { field, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { field: null, direction: null };
        }
      }
      // New field or no current sort
      return { field, direction: "asc" };
    });
  }, []);

  const clearSort = useCallback(() => {
    setSorting({ field: null, direction: null });
  }, []);

  // ============================================================
  // SEARCH OPERATIONS
  // ============================================================

  const setSearchQuery = useCallback((value: string) => {
    setSearch({ query: value });
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, pageNo: 1 }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearch({ query: "" });
  }, []);

  // ============================================================
  // FILTERING OPERATIONS
  // ============================================================

  const setGlobalFilter = useCallback((value: string) => {
    setFiltering((prev) => ({ ...prev, global: value }));
    // Reset to first page when filtering
    setPagination((prev) => ({ ...prev, pageNo: 1 }));
  }, []);

  const clearFilter = useCallback(() => {
    setFiltering({ global: "" });
  }, []);

  // ============================================================
  // PAGINATION OPERATIONS
  // ============================================================

  const canGoNext = pagination.pageNo < totalPages;
  const canGoPrevious = pagination.pageNo > 1;

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setPagination((prev) => ({ ...prev, pageNo: prev.pageNo + 1 }));
    }
  }, [canGoNext]);

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setPagination((prev) => ({ ...prev, pageNo: prev.pageNo - 1 }));
    }
  }, [canGoPrevious]);

  const goToPage = useCallback(
    (page: number) => {
      const pageNo = Math.max(1, Math.min(page, totalPages)); // Clamp between 1 and totalPages
      setPagination((prev) => ({ ...prev, pageNo }));
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: size,
      pageNo: 1, // Reset to first page
    }));
  }, []);

  // ============================================================
  // REFETCH OPERATION
  // ============================================================

  const refetch = useCallback(async (): Promise<ListResponse<T>> => {
    const [listResult] = await Promise.all([queryRefetch(), countRefetch()]);
    return listResult.data || { Data: [] };
  }, [queryRefetch, countRefetch]);

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    // Data
    rows,
    totalItems,

    // Loading States
    isLoading: isLoading || isCountLoading,
    isFetching: isFetching || isCountFetching,

    // Error Handling
    error: (error || countError) as Error | null,

    // Search (Flat Access)
    search: {
      query: search.query,
      setQuery: setSearchQuery,
      clear: clearSearch,
    },

    // Sorting (Flat Access)
    sort: {
      field: sorting.field,
      direction: sorting.direction,
      toggle: toggleSort,
      clear: clearSort,
    },

    // Legacy Global Filtering (Flat Access)
    globalFilter: {
      value: filtering.global,
      setValue: setGlobalFilter,
      clear: clearFilter,
    },

    // Advanced Filtering (Filter Conditions)
    filter: {
      // State
      conditions: filterHook.conditions,
      logicalOperator: filterHook.logicalOperator,
      isValid: filterHook.isValid,
      validationErrors: filterHook.validationErrors,
      hasConditions: filterHook.hasConditions,

      // Condition Management
      addCondition: filterHook.addCondition,
      updateCondition: filterHook.updateCondition,
      removeCondition: filterHook.removeCondition,
      clearConditions: filterHook.clearConditions,
      getCondition: filterHook.getCondition,

      // Logical Operator
      setLogicalOperator: filterHook.setLogicalOperator,

      // Bulk Operations
      setConditions: filterHook.setConditions,
      replaceCondition: filterHook.replaceCondition,

      // Validation
      validateCondition: filterHook.validateCondition,
      validateAllConditions: filterHook.validateAllConditions,

      // State Management
      exportState: filterHook.exportState,
      importState: filterHook.importState,
      resetToInitial: filterHook.resetToInitial,

      // Utilities
      getConditionCount: filterHook.getConditionCount,
    },

    // Pagination (Flat Access)
    pagination: {
      currentPage: pagination.pageNo, // Already 1-indexed
      pageSize: pagination.pageSize,
      totalPages,
      totalItems,
      canGoNext,
      canGoPrevious,
      goToNext,
      goToPrevious,
      goToPage,
      setPageSize,
    },

    // Operations
    refetch,
  };
}
