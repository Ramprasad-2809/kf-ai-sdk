import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api";
import type { ListResponse, ListOptions } from "../../../types/common";
import { useFilter } from "../useFilter";
import type { UseTableOptions, UseTableReturn } from "./types";

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
//
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
//
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
    initialLogicalOperator: options.initialState?.filterOperator || "And",
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

  // Options for count query - excludes sorting and pagination (they don't affect count)
  const countApiOptions = useMemo((): ListOptions => {
    const opts: ListOptions = {};

    // Add search query (affects count)
    if (search.query) {
      opts.Search = search.query;
    }

    // Add filter conditions (affects count)
    if (filterHook.filterPayload) {
      opts.Filter = filterHook.filterPayload;
    }

    return opts;
  }, [search.query, filterHook.filterPayload]);

  // Options for list query - includes all options
  const apiOptions = useMemo((): ListOptions => {
    const opts: ListOptions = { ...countApiOptions };

    // Add sorting - using correct API format: [{ "fieldName": "ASC" }]
    if (sorting.field && sorting.direction) {
      opts.Sort = [
        {
          [String(sorting.field)]: sorting.direction === "asc" ? "ASC" : "DESC",
        },
      ];
    }

    // Add pagination
    if (options.enablePagination) {
      opts.Page = pagination.pageNo; // Already 1-indexed
      opts.PageSize = pagination.pageSize;
    }

    return opts;
  }, [countApiOptions, sorting, pagination, options.enablePagination]);

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

  // Count query for accurate total items (only depends on filters/search, not sorting/pagination)
  const {
    data: countData,
    isLoading: isCountLoading,
    isFetching: isCountFetching,
    error: countError,
    refetch: countRefetch,
  } = useQuery({
    queryKey: ["table-count", options.source, countApiOptions],
    queryFn: async () => {
      try {
        return await api<T>(options.source).count(countApiOptions);
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

  const setSort = useCallback(
    (field: keyof T | null, direction: "asc" | "desc" | null) => {
      setSorting({ field, direction });
    },
    []
  );

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
      set: setSort,
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
