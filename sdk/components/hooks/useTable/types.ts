import type {
  ListResponseType,
  ListOptionsType,
  CountResponseType,
  SortType,
} from '../../../types/common';
import type { UseFilterReturnType, UseFilterOptionsType } from '../useFilter';

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
  /** Unique query key for React Query caching */
  queryKey: string[];
  /** Fetch list data (POST with filter/sort/pagination) */
  listFn: (options: ListOptionsType) => Promise<ListResponseType<T>>;
  /** Fetch count (POST with filter only) */
  countFn: (options: ListOptionsType) => Promise<CountResponseType>;
  /** Initial state */
  initialState?: {
    /** Sort configuration: [{ "fieldName": "ASC" }] */
    sort?: SortType;
    /** Pagination state: { pageNo, pageSize } */
    pagination?: PaginationStateType;
    /** Filter state: { conditions, operator } */
    filter?: UseFilterOptionsType<T>;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback — receives rows from current page */
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
    field: keyof T | null;
    set: (field: keyof T, query: string) => void;
    clear: () => void;
  };

  // Sorting (Flat Access)
  sort: {
    field: keyof T | null;
    direction: 'ASC' | 'DESC' | null;
    toggle: (field: keyof T) => void;
    clear: () => void;
    set: (field: keyof T | null, direction: 'ASC' | 'DESC' | null) => void;
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
