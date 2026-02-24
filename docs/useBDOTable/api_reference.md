# useBDOTable API Reference

```tsx
import { useBDOTable } from '@ram_28/kf-ai-sdk/table';
import type {
  UseBDOTableOptionsType,
  UseBDOTableReturnType,
  PaginationStateType,
} from '@ram_28/kf-ai-sdk/table/types';
```

## Signature

```tsx
const table: UseBDOTableReturnType<ProductBdo> = useBDOTable(options: UseBDOTableOptionsType<ProductBdo>);
```

## Options

`UseBDOTableOptionsType<B>`

- `bdo: B`
  - **Required**
  - BDO instance with `list()` and `count()` methods. Must be memoized with `useMemo()`.
- `initialState`
  - **Optional**
  - Object with:
    - `sort?: SortType` — Initial sort configuration. Format: `[{ "fieldName": "ASC" }]`
    - `pagination?: PaginationStateType` — Initial page and page size. Defaults to `{ pageNo: 1, pageSize: 10 }`.
    - `filter?: UseFilterOptionsType<T>` — Initial filter conditions and operator.
- `onError?: (error: Error) => void`
  - **Optional**
  - Called when a list or count fetch fails.
- `onSuccess?: (data: T[]) => void`
  - **Optional**
  - Called with the current page rows after a successful list fetch.

## Return Value

`UseBDOTableReturnType<B>`

Alias for `UseTableReturnType<BDORowType<B>>`. `BDORowType<B>` resolves to `ItemType<TEditable, TReadonly>` — inferred from the BDO's `list()` return type. Rows are proxy objects with `.get()` accessors, not plain objects.

### Data

- `rows: ItemType<TEditable, TReadonly>[]`
  - Array of `ItemType` instances for the current page. Access field values via `.get()` (e.g. `row.Title.get()`), not direct property access. Empty array during initial loading.
- `totalItems: number`
  - Total number of records matching the current filters and search. `0` while count is loading.

### Loading & Error

- `isLoading: boolean`
  - `true` during the initial load of both list and count queries.
- `isFetching: boolean`
  - `true` during any fetch including background refetches for list or count.
- `error: Error | null`
  - Most recent fetch error from either list or count query. `null` when no error.

### Search

- `search.query: string`
  - Current search input value (updated immediately on `set()`).
- `search.field: keyof T | null`
  - The field currently being searched. `null` when no search is active.
- `search.set(field: keyof T, query: string): void`
  - Set the search field and query. The input value updates immediately; the API query is debounced by 300 ms. Pagination resets to page 1 after the debounce. Query is capped at 255 characters.
- `search.clear(): void`
  - Clear the search field and query. Pagination resets to page 1.

### Sort

- `sort.field: keyof T | null`
  - Currently sorted field. `null` when no sort is active.
- `sort.direction: "ASC" | "DESC" | null`
  - Current sort direction. `null` when no sort is active.
- `sort.toggle(field: keyof T): void`
  - Cycle the sort for a field: ASC -> DESC -> cleared. If a different field was sorted, starts at ASC.
- `sort.clear(): void`
  - Remove all sorting.
- `sort.set(field: keyof T | null, direction: "ASC" | "DESC" | null): void`
  - Explicitly set the sort field and direction.

### Filter

- `filter: UseFilterReturnType<T>`
  - Full filter state and operations. See [useFilter reference](../useFilter/api_reference.md) for the complete API.

### Pagination

- `pagination.pageNo: number`
  - Current page number (1-indexed).
- `pagination.pageSize: number`
  - Current number of items per page.
- `pagination.totalPages: number`
  - Total number of pages based on `totalItems` and `pageSize`.
- `pagination.totalItems: number`
  - Same as the top-level `totalItems`.
- `pagination.canGoNext: boolean`
  - `true` when a next page exists.
- `pagination.canGoPrevious: boolean`
  - `true` when a previous page exists (i.e. `pageNo > 1`).
- `pagination.goToNext(): void`
  - Navigate to the next page. No-op if already on the last page.
- `pagination.goToPrevious(): void`
  - Navigate to the previous page. No-op if already on page 1.
- `pagination.goToPage(page: number): void`
  - Navigate to a specific page. Clamped to `[1, totalPages]`.
- `pagination.setPageSize(size: number): void`
  - Change the page size. Resets to page 1.

### Operations

- `refetch(): Promise<ListResponseType<T>>`
  - Manually refetch both the list and count queries. Returns the list response.

## Exported Constants

Available from `@ram_28/kf-ai-sdk/table`:

```typescript
import { SortDirection, TableDefaults } from '@ram_28/kf-ai-sdk/table';
```

**SortDirection**

| Key | Value |
|-----|-------|
| `ASC` | `"ASC"` |
| `DESC` | `"DESC"` |

**TableDefaults**

| Key | Value | Description |
|-----|-------|-------------|
| `SEARCH_DEBOUNCE_MS` | `300` | Debounce delay for search (ms) |
| `PAGE_SIZE` | `10` | Default items per page |
| `PAGE` | `1` | Default page number (1-indexed) |
| `SEARCH_MAX_LENGTH` | `255` | Maximum search query length |

For filter constants (`ConditionOperator`, `GroupOperator`, `RHSType`), see [useFilter reference](../useFilter/api_reference.md).

## Types

```typescript
import type { ItemType } from '@ram_28/kf-ai-sdk/bdo/types';

// ============================================================
// Options
// ============================================================

interface UseBDOTableOptionsType<B extends BDOTableSourceType> {
  bdo: B;
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<BDORowType<B>>;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: BDORowType<B>[]) => void;
}

// ============================================================
// Return type
// ============================================================

type UseBDOTableReturnType<B extends BDOTableSourceType> =
  UseTableReturnType<BDORowType<B>>;

// When used via UseBDOTableReturnType<B>, T = ItemType<TEditable, TReadonly>
// ItemType<TEditable, TReadonly> provides:
//   row._id: string                            (direct access, no .get())
//   row.Field.get(): value                     (read field value)
//   row.Field.set(value): void                 (editable fields only)
//   row.Field.validate(): ValidationResultType (single field)
//   row.Field.label / .required / .readOnly / .defaultValue / .meta
//   row.toJSON(): plain object
//   row.validate(): ValidationResultType       (all fields)
interface UseTableReturnType<T> {
  // Data
  rows: T[];
  totalItems: number;

  // Loading States
  isLoading: boolean;
  isFetching: boolean;

  // Error Handling
  error: Error | null;

  // Search
  search: {
    query: string;
    field: keyof T | null;
    set: (field: keyof T, query: string) => void;
    clear: () => void;
  };

  // Sorting
  sort: {
    field: keyof T | null;
    direction: 'ASC' | 'DESC' | null;
    toggle: (field: keyof T) => void;
    clear: () => void;
    set: (field: keyof T | null, direction: 'ASC' | 'DESC' | null) => void;
  };

  // Filter
  filter: UseFilterReturnType<T>;

  // Pagination
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

// ============================================================
// State types
// ============================================================

interface PaginationStateType {
  pageNo: number;
  pageSize: number;
}

// ============================================================
// Sort
// ============================================================

type SortOptionType = Record<string, 'ASC' | 'DESC'>;
type SortType = SortOptionType[];

// Filter types — see useFilter reference (../useFilter/api_reference.md)

// ============================================================
// Row type inference
// ============================================================

type BDORowType<B extends BDOTableSourceType> =
  B extends { list(opts?: any): Promise<(infer R)[]> } ? R : never;
```
