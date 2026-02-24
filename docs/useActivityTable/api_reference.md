# useActivityTable API Reference

```tsx
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import type {
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityRowType,
  ActivityTableStatusType,
} from "@ram_28/kf-ai-sdk/workflow";
import type { ActivityInstanceFieldsType } from "@ram_28/kf-ai-sdk/workflow";
```

## Signature

```tsx
const table: UseActivityTableReturnType<A> = useActivityTable<A>(options: UseActivityTableOptionsType<A>);
```

## Options

`UseActivityTableOptionsType<A>`

- `activity: A`
  - **Required**
  - Activity instance with `getInProgressList()`, `getCompletedList()`, `inProgressCount()`, and `completedCount()` methods. Must be memoized with `useMemo()`.
- `status: ActivityTableStatusType`
  - **Required**
  - `ActivityTableStatus.InProgress` or `ActivityTableStatus.Completed`. Determines whether in-progress or completed items are fetched.
- `initialState`
  - **Optional**
  - Object with:
    - `sort?: SortType` — Initial sort configuration. Format: `[{ "fieldName": "ASC" }]`
    - `pagination?: PaginationStateType` — Initial page and page size. Defaults to `{ pageNo: 1, pageSize: 10 }`.
    - `filter?: UseFilterOptionsType<ActivityRowType<A>>` — Initial filter conditions and operator.
- `onError?: (error: Error) => void`
  - **Optional**
  - Called when fetching items or count fails.
- `onSuccess?: (data: ActivityRowType<A>[]) => void`
  - **Optional**
  - Called with the current page rows after a successful list fetch.

## Return Value

`UseActivityTableReturnType<A>`

Alias for `UseTableReturnType<ActivityRowType<A>>`. `ActivityRowType<A>` resolves to `ActivityInstanceType<TEntity & ActivityInstanceFieldsType, TEditable, TReadonly & ActivitySystemReadonlyType>` — inferred from the Activity's `getInProgressList()` return type. Rows are proxy objects with `.get()` accessors, persistence methods, and activity system fields.

### Data

- `rows: ActivityInstanceType<...>[]`
  - Array of `ActivityInstanceType` proxy instances for the current page. Access field values via `.get()` (e.g. `row.LeaveType.get()`), not direct property access. Each row also has persistence methods (`update()`, `save()`, `complete()`, `progress()`) and activity system fields (`BPInstanceId`, `Status`, `AssignedTo`, `CompletedAt`). Empty array during initial loading.
- `totalItems: number`
  - Total number of records matching the current filters and search. `0` while count is loading.

### Loading & Error

- `isLoading: boolean`
  - `true` during the initial load of both items and count.
- `isFetching: boolean`
  - `true` during any fetch including background refetches for items or count.
- `error: Error | null`
  - Most recent fetch error from either items or count. `null` when no error.

### Search

- `search.query: string`
  - Current search input value (updated immediately on `set()`).
- `search.field: keyof T | null`
  - The field currently being searched. `null` when no search is active.
- `search.set(field: keyof T, query: string): void`
  - Set the search field and query. The input value updates immediately; the data fetch is debounced by 300 ms. Pagination resets to page 1 after the debounce. Query is capped at 255 characters.
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
  - Manually refetch both the items and the count. Returns the list response.

## Exported Constants

Available from `@ram_28/kf-ai-sdk/workflow`:

```typescript
import { ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
```

**ActivityTableStatus**

| Key | Value | Description |
|-----|-------|-------------|
| `InProgress` | `"inprogress"` | Fetches the in-progress items of the current activity |
| `Completed` | `"completed"` | Fetches the completed items of the current activity |

**SortDirection** (from `@ram_28/kf-ai-sdk/table`)

| Key | Value |
|-----|-------|
| `ASC` | `"ASC"` |
| `DESC` | `"DESC"` |

**TableDefaults** (from `@ram_28/kf-ai-sdk/table`)

| Key | Value | Description |
|-----|-------|-------------|
| `SEARCH_DEBOUNCE_MS` | `300` | Debounce delay for search (ms) |
| `PAGE_SIZE` | `10` | Default items per page |
| `PAGE` | `1` | Default page number (1-indexed) |
| `SEARCH_MAX_LENGTH` | `255` | Maximum search query length |

For filter constants (`ConditionOperator`, `GroupOperator`, `RHSType`), see [useFilter reference](../useFilter/api_reference.md).

## Types

```typescript
import type { ActivityInstanceType } from "@ram_28/kf-ai-sdk/workflow";

// ============================================================
// Options
// ============================================================

interface UseActivityTableOptionsType<A extends Activity<any, any, any>> {
  activity: A;
  status: ActivityTableStatusType;
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<ActivityRowType<A>>;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: ActivityRowType<A>[]) => void;
}

// ============================================================
// Return type
// ============================================================

type UseActivityTableReturnType<A extends Activity<any, any, any>> =
  UseTableReturnType<ActivityRowType<A>>;

// ActivityRowType resolves to ActivityInstanceType<...>
// ActivityInstanceType<TEntity, TEditable, TReadonly> provides:
//   row._id: string                              (direct access, no .get())
//   row.Field.get(): value                       (read field value)
//   row.Field.set(value): void                   (editable fields only)
//   row.Field.validate(): ValidationResultType   (single field)
//   row.Field.label / .required / .readOnly / .defaultValue / .meta
//   row.toJSON(): plain object
//   row.validate(): ValidationResultType         (all fields)
//   row.update(data): Promise                    (persist changes)
//   row.save(data): Promise                      (commit draft)
//   row.complete(): Promise                      (complete activity)
//   row.progress(): Promise                      (get workflow progress)

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
    direction: "ASC" | "DESC" | null;
    toggle: (field: keyof T) => void;
    clear: () => void;
    set: (field: keyof T | null, direction: "ASC" | "DESC" | null) => void;
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
// Status
// ============================================================

const ActivityTableStatus = {
  InProgress: "inprogress",
  Completed: "completed",
} as const;

type ActivityTableStatusType =
  (typeof ActivityTableStatus)[keyof typeof ActivityTableStatus];
// resolves to: "inprogress" | "completed"

// ============================================================
// Row type inference
// ============================================================

type ActivityRowType<A extends Activity<any, any, any>> =
  A extends { getInProgressList(opts?: any): Promise<(infer R)[]> }
    ? R
    : never;

// ============================================================
// Activity system fields
// ============================================================

type ActivityInstanceFieldsType = {
  _id: string;
  BPInstanceId: string;
  Status: "InProgress" | "Completed";
  AssignedTo: Array<{ _id: string; _name: string }>;
  CompletedAt: string; // ISO 8601 datetime
};

// ============================================================
// State types
// ============================================================

interface PaginationStateType {
  pageNo: number;
  pageSize: number;
}

type SortOptionType = Record<string, "ASC" | "DESC">;
type SortType = SortOptionType[];

// Filter types — see useFilter reference (../useFilter/api_reference.md)
```
