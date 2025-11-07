import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import type { ListResponse, ListOptions } from "../../types/common";

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
  /** Initial state */
  initialState?: {
    pagination?: {
      pageIndex: number;
      pageSize: number;
    };
    sorting?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
    globalFilter?: string;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: (data: T[]) => void;
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

  // Filtering (Flat Access)
  filter: {
    global: string;
    setGlobal: (value: string) => void;
    clear: () => void;
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
  pageIndex: number;
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
    pageIndex: options.initialState?.pagination?.pageIndex || 0,
    pageSize: options.initialState?.pagination?.pageSize || 10,
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

    // Add search query (global search across multiple fields)
    if (search.query && options.enableFiltering) {
      // This is a simplified global search - applies across all searchable columns
      opts.Filter = {
        Operator: "OR",
        Condition: options.columns
          .filter((col) => col.enableFiltering !== false)
          .map((col) => ({
            Operator: "Contains" as const,
            LHSField: String(col.fieldId),
            RHSValue: search.query,
          })),
      };
    }

    // Add pagination
    if (options.enablePagination) {
      opts.Page = pagination.pageIndex + 1; // Convert to 1-indexed
      opts.PageSize = pagination.pageSize;
    }

    return opts;
  }, [
    sorting,
    search.query,
    pagination,
    options.columns,
    options.enableFiltering,
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
  });

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const rows = useMemo(() => data?.Data || [], [data]);
  const totalItems = useMemo(() => data?.Data?.length || 0, [data]); // Note: This should come from API response

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
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
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
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const clearFilter = useCallback(() => {
    setFiltering({ global: "" });
  }, []);

  // ============================================================
  // PAGINATION OPERATIONS
  // ============================================================

  const canGoNext = pagination.pageIndex < totalPages - 1;
  const canGoPrevious = pagination.pageIndex > 0;

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex + 1 }));
    }
  }, [canGoNext]);

  const goToPrevious = useCallback(() => {
    if (canGoPrevious) {
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    }
  }, [canGoPrevious]);

  const goToPage = useCallback(
    (page: number) => {
      const pageIndex = Math.max(0, Math.min(page - 1, totalPages - 1)); // Convert to 0-indexed and clamp
      setPagination((prev) => ({ ...prev, pageIndex }));
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: size,
      pageIndex: 0, // Reset to first page
    }));
  }, []);

  // ============================================================
  // REFETCH OPERATION
  // ============================================================

  const refetch = useCallback(async (): Promise<ListResponse<T>> => {
    const result = await queryRefetch();
    return result.data || { Data: [] };
  }, [queryRefetch]);

  // ============================================================
  // RETURN OBJECT
  // ============================================================

  return {
    // Data
    rows,
    totalItems,

    // Loading States
    isLoading,
    isFetching,

    // Error Handling
    error: error as Error | null,

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

    // Filtering (Flat Access)
    filter: {
      global: filtering.global,
      setGlobal: setGlobalFilter,
      clear: clearFilter,
    },

    // Pagination (Flat Access)
    pagination: {
      currentPage: pagination.pageIndex + 1, // Convert to 1-indexed for UI
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
