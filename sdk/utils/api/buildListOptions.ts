// ============================================================
// BUILD LIST OPTIONS UTILITY
// ============================================================
// Shared utility for building API list options across hooks

import type { ListOptionsType, FilterType, SortType } from "../../types/common";

/**
 * Options for building list API request options
 */
export interface BuildListOptionsParams<T = any> {
  /** Search query string */
  search?: string;
  /** Filter payload */
  filter?: FilterType<T>;
  /** Sort configuration */
  sort?: {
    field: keyof T | null;
    direction: "ASC" | "DESC" | null;
  };
  /** Sort array in API format */
  sortArray?: SortType;
  /** Pagination settings */
  pagination?: {
    pageNo: number;
    pageSize: number;
  };
}

/**
 * Build list options for count queries
 * Excludes pagination and sorting (they don't affect count)
 */
export function buildCountOptions<T = any>(
  params: Pick<BuildListOptionsParams<T>, "search" | "filter">
): ListOptionsType {
  const opts: ListOptionsType = {};

  if (params.search) {
    opts.Search = params.search;
  }

  if (params.filter) {
    opts.Filter = params.filter;
  }

  return opts;
}

/**
 * Build list options for data queries
 * Includes all options: search, filter, sort, pagination
 */
export function buildListOptions<T = any>(
  params: BuildListOptionsParams<T>
): ListOptionsType {
  const opts: ListOptionsType = buildCountOptions({
    search: params.search,
    filter: params.filter,
  });

  // Add sorting - convert internal format to API format
  if (params.sort?.field && params.sort?.direction) {
    opts.Sort = [
      {
        [String(params.sort.field)]: params.sort.direction,
      },
    ];
  } else if (params.sortArray) {
    opts.Sort = params.sortArray;
  }

  // Add pagination
  if (params.pagination) {
    opts.Page = params.pagination.pageNo;
    opts.PageSize = params.pagination.pageSize;
  }

  return opts;
}

/**
 * Combine filter payload with additional column filter
 * Used for kanban column-specific queries
 */
export function combineFilters<T = any>(
  baseFilter: FilterType<T> | undefined,
  additionalCondition: {
    LHSField: string;
    Operator: string;
    RHSValue: any;
    RHSType?: string;
  }
): FilterType<T> {
  const columnFilterObject = {
    ...additionalCondition,
    RHSType: additionalCondition.RHSType || "Constant",
  };

  if (!baseFilter) {
    return {
      Operator: "And",
      Condition: [columnFilterObject],
    } as FilterType<T>;
  }

  // If base is And, append. If base is Or/Not, wrap in new And.
  if (baseFilter.Operator === "And") {
    return {
      ...baseFilter,
      Condition: [...(baseFilter.Condition || []), columnFilterObject],
    } as FilterType<T>;
  }

  return {
    Operator: "And",
    Condition: [baseFilter, columnFilterObject],
  } as FilterType<T>;
}
