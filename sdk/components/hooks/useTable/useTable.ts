import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../api";
import type { ListResponseType, ListOptionsType } from "../../../types/common";
import { toError } from "../../../utils/error-handling";
import { useFilter } from "../useFilter";
import type { UseTableOptionsType, UseTableReturnType } from "./types";

// ============================================================
// INTERNAL STATE TYPES
// ============================================================

interface SearchState {
  query: string; // Immediate UI value
  debouncedQuery: string; // Debounced value for API queries
}

interface SortingState<T> {
  field: keyof T | null;
  direction: "asc" | "desc" | null;
}

interface PaginationState {
  pageNo: number; // 1-indexed page number
  pageSize: number;
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useTable<T = any>(
  options: UseTableOptionsType<T>
): UseTableReturnType<T> {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================

  const [search, setSearch] = useState<SearchState>({
    query: "",
    debouncedQuery: "",
  });

  // Debounce timeout ref for search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const SEARCH_DEBOUNCE_MS = 300;

  // Parse initial sort from API format [{ "fieldName": "ASC" }] to internal state
  const getInitialSortState = (): SortingState<T> => {
    const sortConfig = options.initialState?.sort;
    if (sortConfig && sortConfig.length > 0) {
      const firstSort = sortConfig[0];
      const field = Object.keys(firstSort)[0] as keyof T;
      const direction = firstSort[field as string]?.toLowerCase() as "asc" | "desc";
      return { field, direction };
    }
    return { field: null, direction: null };
  };

  const [sorting, setSorting] = useState<SortingState<T>>(getInitialSortState);

  const [pagination, setPagination] = useState<PaginationState>({
    pageNo: options.initialState?.pagination?.pageNo || 1,
    pageSize: options.initialState?.pagination?.pageSize || 10,
  });

  // ============================================================
  // FILTER HOOK INTEGRATION
  // ============================================================

  const filter = useFilter<T>({
    initialConditions: options.initialState?.filter?.conditions,
    initialOperator: options.initialState?.filter?.operator || "And",
  });

  // ============================================================
  // API OPTIONS BUILDER
  // ============================================================

  // Options for count query - excludes sorting and pagination (they don't affect count)
  const countApiOptions = useMemo((): ListOptionsType => {
    const opts: ListOptionsType = {};

    // Add debounced search query (affects count)
    if (search.debouncedQuery) {
      opts.Search = search.debouncedQuery;
    }

    // Add filter conditions (affects count)
    if (filter.payload) {
      opts.Filter = filter.payload;
    }

    return opts;
  }, [search.debouncedQuery, filter.payload]);

  // Options for list query - includes all options
  const apiOptions = useMemo((): ListOptionsType => {
    const opts: ListOptionsType = { ...countApiOptions };

    // Add sorting - using correct API format: [{ "fieldName": "ASC" }]
    if (sorting.field && sorting.direction) {
      opts.Sort = [
        {
          [String(sorting.field)]: sorting.direction === "asc" ? "ASC" : "DESC",
        },
      ];
    }

    // Add pagination
    opts.Page = pagination.pageNo;
    opts.PageSize = pagination.pageSize;

    return opts;
  }, [countApiOptions, sorting, pagination]);

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
    queryFn: async (): Promise<ListResponseType<T>> => {
      try {
        const response = await api<T>(options.source).list(apiOptions);
        if (options.onSuccess) {
          options.onSuccess(response.Data);
        }
        return response;
      } catch (err) {
        if (options.onError) {
          options.onError(toError(err));
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
    queryKey: ["table-count", options.source, countApiOptions],
    queryFn: async () => {
      try {
        return await api<T>(options.source).count(countApiOptions);
      } catch (err) {
        if (options.onError) {
          options.onError(toError(err));
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
        if (prev.direction === "asc") {
          return { field, direction: "desc" };
        } else if (prev.direction === "desc") {
          return { field: null, direction: null };
        }
      }
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
    // Validate search query length to prevent DoS
    if (value.length > 255) {
      console.warn("Search query exceeds maximum length of 255 characters");
      return;
    }

    // Update immediate value for UI
    setSearch((prev) => ({ ...prev, query: value }));

    // Clear existing debounce timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Debounce the actual API query update
    searchDebounceRef.current = setTimeout(() => {
      setSearch((prev) => ({ ...prev, debouncedQuery: value }));
      setPagination((prev) => ({ ...prev, pageNo: 1 }));
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const clearSearch = useCallback(() => {
    // Clear debounce timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setSearch({ query: "", debouncedQuery: "" });
    setPagination((prev) => ({ ...prev, pageNo: 1 }));
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
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
      const pageNo = Math.max(1, Math.min(page, totalPages));
      setPagination((prev) => ({ ...prev, pageNo }));
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: size,
      pageNo: 1,
    }));
  }, []);

  // ============================================================
  // REFETCH OPERATION
  // ============================================================

  const refetch = useCallback(async (): Promise<ListResponseType<T>> => {
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
    error: error ? toError(error) : countError ? toError(countError) : null,

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

    // Filter (Simplified chainable API)
    filter,

    // Pagination (Flat Access)
    pagination: {
      pageNo: pagination.pageNo,
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
