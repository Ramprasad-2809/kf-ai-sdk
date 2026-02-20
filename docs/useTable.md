# useTable

A generic, low-level React hook for building custom table/list components with server-side data fetching, search, sort, filter, and pagination. `useTable` does not know about BDOs or activity instances -- it operates on arbitrary data via the `listFn` and `countFn` callbacks you provide.

> **For BDO tables use `useBDOTable`.** It wraps `useTable` with `api(bo_id).list` and `api(bo_id).count` so you only pass `source` and `columns`.
>
> **For activity tables use `useActivityTable`.** It wraps `useTable` with workflow-specific list/count functions.
>
> Use the base `useTable` hook only when you need a custom data source that neither `useBDOTable` nor `useActivityTable` covers.

---

## Imports

```typescript
import { useTable } from '@ram_28/kf-ai-sdk/table';
import type {
  UseTableOptionsType,
  UseTableReturnType,
  PaginationStateType,
} from '@ram_28/kf-ai-sdk/table';
```

---

## Type Definitions

### UseTableOptionsType

```typescript
interface UseTableOptionsType<T> {
  // Unique query key for React Query caching (required).
  // Must be stable across renders. Include identifiers that
  // distinguish this table from others (e.g. ['my-table', entityId]).
  queryKey: string[];

  // Fetch a page of data. Receives the assembled ListOptionsType
  // (Filter, Sort, Page, PageSize) and must return { Data: T[] }.
  listFn: (options: ListOptionsType) => Promise<ListResponseType<T>>;

  // Fetch total count. Receives the same ListOptionsType (only Filter
  // is relevant -- Sort/Page/PageSize are ignored by the backend).
  // Must return { Count: number }.
  countFn: (options: ListOptionsType) => Promise<CountResponseType>;

  // Optional initial state applied on first render.
  initialState?: {
    // Initial sort. Format: [{ 'fieldName': 'ASC' }]
    sort?: SortType;

    // Initial pagination. Defaults: { pageNo: 1, pageSize: 10 }
    pagination?: PaginationStateType;

    // Initial filter conditions.
    // See useFilter docs for full options.
    filter?: UseFilterOptionsType<T>;
  };

  // Called when a list or count fetch fails.
  onError?: (error: Error) => void;

  // Called with the current page rows after a successful list fetch.
  onSuccess?: (data: T[]) => void;
}
```

### UseTableReturnType

```typescript
interface UseTableReturnType<T> {
  // ============================================================
  // DATA
  // ============================================================

  // Current page data (array of records).
  rows: T[];

  // Total matching records across all pages.
  totalItems: number;

  // ============================================================
  // LOADING STATES
  // ============================================================

  // True during initial load.
  isLoading: boolean;

  // True during background refetch.
  isFetching: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  // Current error state, null when no error.
  error: Error | null;

  // ============================================================
  // SEARCH (field-based search using filter conditions)
  // ============================================================

  search: {
    // Current search query string.
    query: string;

    // Field being searched, null if no search active.
    field: keyof T | null;

    // Set search field and query (triggers API call, 300ms debounced).
    // Internally creates a Contains filter condition.
    set: (field: keyof T, query: string) => void;

    // Clear search and reset to empty string (triggers API call).
    clear: () => void;
  };

  // ============================================================
  // SORT (single column sorting)
  // ============================================================

  sort: {
    // Currently sorted field, null if no sort active.
    field: keyof T | null;

    // Current sort direction, null if no sort active.
    direction: 'ASC' | 'DESC' | null;

    // Toggle sort on a field (triggers API call).
    // Cycles: none -> ASC -> DESC -> none.
    toggle: (field: keyof T) => void;

    // Clear sorting (triggers API call).
    clear: () => void;

    // Set explicit sort field and direction (triggers API call).
    set: (field: keyof T, direction: 'ASC' | 'DESC') => void;
  };

  // ============================================================
  // FILTER (see useFilter docs for full API)
  // ============================================================

  // Full useFilter return type.
  // Includes addCondition, removeCondition, clearAllConditions, etc.
  filter: UseFilterReturnType<T>;

  // ============================================================
  // PAGINATION (1-indexed pages)
  // ============================================================

  pagination: {
    // Current page number (1-indexed, starts at 1).
    pageNo: number;

    // Number of items per page.
    pageSize: number;

    // Total number of pages.
    totalPages: number;

    // Total matching records (same as top-level totalItems).
    totalItems: number;

    // True if there is a next page available.
    canGoNext: boolean;

    // True if there is a previous page available.
    canGoPrevious: boolean;

    // Navigate to next page.
    goToNext: () => void;

    // Navigate to previous page.
    goToPrevious: () => void;

    // Navigate to specific page number (1-indexed).
    goToPage: (page: number) => void;

    // Change items per page (resets to page 1).
    setPageSize: (size: number) => void;
  };

  // ============================================================
  // OPERATIONS
  // ============================================================

  // Manually trigger data refetch (both list and count).
  // Returns promise with the list response.
  refetch: () => Promise<ListResponseType<T>>;
}
```

### PaginationStateType

```typescript
interface PaginationStateType {
  // Page number (1-indexed).
  pageNo: number;

  // Number of items per page.
  pageSize: number;
}
```

---

## Building a Custom Table Hook

The base `useTable` hook is designed to be wrapped. You provide `queryKey`, `listFn`, and `countFn` -- everything else (search, sort, filter, pagination) is managed internally.

Below is a minimal example that fetches from a hypothetical REST endpoint.

```typescript
import { useTable } from '@ram_28/kf-ai-sdk/table';
import type {
  UseTableReturnType,
  PaginationStateType,
} from '@ram_28/kf-ai-sdk/table';
import type {
  ListOptionsType,
  ListResponseType,
  CountResponseType,
} from '@ram_28/kf-ai-sdk/types';

interface LogEntry {
  _id: string;
  timestamp: string;
  level: string;
  message: string;
}

interface UseLogTableOptions {
  service: string;
  initialState?: {
    pagination?: PaginationStateType;
  };
}

function useLogTable(opts: UseLogTableOptions): UseTableReturnType<LogEntry> {
  const listFn = async (
    options: ListOptionsType,
  ): Promise<ListResponseType<LogEntry>> => {
    const res = await fetch('/api/logs/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: opts.service, ...options }),
    });
    return res.json();
  };

  const countFn = async (
    options: ListOptionsType,
  ): Promise<CountResponseType> => {
    const res = await fetch('/api/logs/count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: opts.service, ...options }),
    });
    return res.json();
  };

  return useTable<LogEntry>({
    queryKey: ['logs', opts.service],
    listFn,
    countFn,
    initialState: {
      pagination: opts.initialState?.pagination ?? { pageNo: 1, pageSize: 50 },
    },
  });
}
```

Usage in a component:

```tsx
function LogViewer() {
  const table = useLogTable({ service: 'payment-service' });

  if (table.isLoading) return <div>Loading...</div>;
  if (table.error) return <div>Error: {table.error.message}</div>;

  return (
    <div>
      <input
        type='text'
        placeholder='Search logs...'
        value={table.search.query}
        onChange={(e) => table.search.set('message', e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th onClick={() => table.sort.toggle('timestamp')}>
              Timestamp
              {table.sort.field === 'timestamp' && (
                <span>{table.sort.direction === 'ASC' ? ' up' : ' down'}</span>
              )}
            </th>
            <th>Level</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id}>
              <td>{row.timestamp}</td>
              <td>{row.level}</td>
              <td>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          onClick={table.pagination.goToPrevious}
          disabled={!table.pagination.canGoPrevious}
        >
          Previous
        </button>
        <span>
          Page {table.pagination.pageNo} of {table.pagination.totalPages}
        </span>
        <button
          onClick={table.pagination.goToNext}
          disabled={!table.pagination.canGoNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Search API

Search is implemented as a debounced filter condition. When you call `search.set(field, query)`, the hook internally creates a `Contains` filter condition on the given field. The debounce delay is 300ms.

| Member | Type | Description |
|--------|------|-------------|
| `search.query` | `string` | Current search query string (updates immediately for UI binding). |
| `search.field` | `keyof T \| null` | Field being searched, `null` if no search active. |
| `search.set(field, query)` | `(field: keyof T, query: string) => void` | Set search field and query. Triggers API call after 300ms debounce. Resets to page 1. |
| `search.clear()` | `() => void` | Clear search query and field. Triggers API call. Resets to page 1. |

```tsx
// Search by a single field
<input
  type='text'
  value={table.search.query}
  onChange={(e) => table.search.set('message', e.target.value)}
/>
{table.search.query && (
  <button onClick={table.search.clear}>Clear</button>
)}
```

---

## Sort API

Single-column sorting. The sort state is sent to the backend as `Sort: [{ 'fieldName': 'ASC' }]`.

| Member | Type | Description |
|--------|------|-------------|
| `sort.field` | `keyof T \| null` | Currently sorted field, `null` if no sort active. |
| `sort.direction` | `'ASC' \| 'DESC' \| null` | Current direction, `null` if no sort active. |
| `sort.toggle(field)` | `(field: keyof T) => void` | Cycle sort: none -> ASC -> DESC -> none. |
| `sort.clear()` | `() => void` | Remove sorting. |
| `sort.set(field, direction)` | `(field: keyof T, direction: 'ASC' \| 'DESC') => void` | Explicitly set field and direction. |

```tsx
// Toggle sort on click
<th onClick={() => table.sort.toggle('timestamp')}>
  Timestamp
  {table.sort.field === 'timestamp' && (
    <span>{table.sort.direction === 'ASC' ? ' up' : ' down'}</span>
  )}
</th>

// Programmatic sort from a dropdown
const handleSortChange = (value: string) => {
  switch (value) {
    case 'newest':
      table.sort.set('timestamp', 'DESC');
      break;
    case 'oldest':
      table.sort.set('timestamp', 'ASC');
      break;
    default:
      table.sort.clear();
      break;
  }
};
```

---

## Filter API

The `filter` property on the return type is the full `UseFilterReturnType<T>` from the `useFilter` hook. See the [useFilter docs](./useFilter.md) for the complete API.

Key methods:

| Method | Description |
|--------|-------------|
| `filter.addCondition(condition)` | Add a filter condition. Triggers API call. Resets to page 1. |
| `filter.removeCondition(index)` | Remove a condition by index. |
| `filter.clearAllConditions()` | Remove all conditions. |
| `filter.payload` | Current filter payload sent to the API (`FilterType \| undefined`). |

```tsx
import { ConditionOperator, RHSType } from '@ram_28/kf-ai-sdk/filter';

// Add a filter condition
table.filter.addCondition({
  LHSField: 'level',
  Operator: ConditionOperator.EQ,
  RHSValue: 'error',
  RHSType: RHSType.Constant,
});

// Clear all filters
table.filter.clearAllConditions();
```

---

## Pagination API

Pages are 1-indexed. Changing filters or search automatically resets to page 1. Changing `pageSize` also resets to page 1.

| Member | Type | Description |
|--------|------|-------------|
| `pagination.pageNo` | `number` | Current page (1-indexed). |
| `pagination.pageSize` | `number` | Items per page. |
| `pagination.totalPages` | `number` | Total pages based on `totalItems` and `pageSize`. |
| `pagination.totalItems` | `number` | Total matching records (same as top-level `totalItems`). |
| `pagination.canGoNext` | `boolean` | `true` if there is a next page. |
| `pagination.canGoPrevious` | `boolean` | `true` if there is a previous page. |
| `pagination.goToNext()` | `() => void` | Go to next page. No-op if already on last page. |
| `pagination.goToPrevious()` | `() => void` | Go to previous page. No-op if already on page 1. |
| `pagination.goToPage(page)` | `(page: number) => void` | Jump to a specific page. Clamped to [1, totalPages]. |
| `pagination.setPageSize(size)` | `(size: number) => void` | Change page size. Resets to page 1. |

```tsx
<div>
  <button
    onClick={table.pagination.goToPrevious}
    disabled={!table.pagination.canGoPrevious}
  >
    Previous
  </button>
  <span>
    Page {table.pagination.pageNo} of {table.pagination.totalPages}
  </span>
  <button
    onClick={table.pagination.goToNext}
    disabled={!table.pagination.canGoNext}
  >
    Next
  </button>
  <select
    value={table.pagination.pageSize}
    onChange={(e) => table.pagination.setPageSize(Number(e.target.value))}
  >
    <option value={10}>10 per page</option>
    <option value={25}>25 per page</option>
    <option value={50}>50 per page</option>
  </select>
</div>
```

---

## Common Mistakes

### 1. Using `useTable` directly for BDO data

`useTable` is the low-level hook. If you are displaying data from a Business Object, use `useBDOTable` instead. It handles `queryKey`, `listFn`, and `countFn` for you.

```typescript
// WRONG -- manually wiring up api() calls when useBDOTable exists
const table = useTable<ProductFieldType>({
  queryKey: ['products'],
  listFn: (opts) => api(product.meta._id).list(opts),
  countFn: (opts) => api(product.meta._id).count(opts),
});

// CORRECT -- use the purpose-built hook
const table = useBDOTable<ProductFieldType>({
  source: product.meta._id,
  columns,
});
```

### 2. Wrong initialState property names

This is NOT react-table. Do not use react-table naming conventions.

```typescript
// WRONG -- sorting and pageIndex do not exist
initialState: { sorting: [...], pagination: { pageIndex: 0, pageSize: 10 } }

// CORRECT -- use sort and pageNo (1-indexed)
initialState: {
  sort: [{ 'Title': 'ASC' }],
  pagination: { pageNo: 1, pageSize: 10 },
}
```

### 3. Wrong sort direction type

Sort direction must be the string literal `'ASC'` or `'DESC'` -- nothing else.

```typescript
// WRONG -- booleans, lowercase, or arbitrary strings
sort.set('Title', true);
sort.set('Title', 'asc');
sort.set('Title', 'ascending');

// CORRECT -- uppercase string literals only
sort.set('Title', 'ASC');
sort.set('Title', 'DESC');
```

### 4. Calling `.get()` on table rows

Table `rows` are plain objects, NOT `ItemType`. The `.get()` method is only available on `ItemType` returned by `bdo.get()`, `bdo.create()`, or the `useForm` item proxy.

```typescript
// WRONG -- rows are plain objects, not ItemType
table.rows.map((row) => row.Title.get());

// CORRECT -- access properties directly
table.rows.map((row) => row.Title);
```

### 5. Using entity-level FieldType as generic

Entity-level types (from `@/bdo/entities/`) exclude `SystemFieldsType`, so `row._id` will not be available.

```typescript
// WRONG -- ProductFieldType excludes _id, _created_at, etc.
import type { ProductFieldType } from '@/bdo/entities/Product';
useTable<ProductFieldType>({ ... });

// CORRECT -- role-specific type includes SystemFieldsType
import type { BuyerProductFieldType } from '@/bdo/buyer/Product';
useTable<BuyerProductFieldType>({ ... });
```

### 6. Unstable queryKey causing infinite refetches

If you create the `queryKey` array inline inside a render function without memoizing it, React Query will see a new reference every render and refetch endlessly.

```typescript
// WRONG -- new array reference every render
const table = useTable({
  queryKey: [someVariable, anotherVariable],
  ...
});

// CORRECT -- stable array, or use string literals
const queryKey = useMemo(() => ['logs', serviceId], [serviceId]);
const table = useTable({
  queryKey,
  ...
});
```

### 7. Forgetting to provide both listFn and countFn

Both callbacks are required. The hook makes separate queries for list data and total count. Omitting `countFn` will cause a runtime error.

```typescript
// WRONG -- missing countFn
useTable({
  queryKey: ['items'],
  listFn: fetchItems,
});

// CORRECT -- provide both
useTable({
  queryKey: ['items'],
  listFn: fetchItems,
  countFn: fetchItemCount,
});
```

### 8. Accessing `data` or `columns` on the return type

The return type does not have `data` or `columns` properties.

```typescript
// WRONG -- these properties do not exist
table.data
table.columns

// CORRECT
table.rows       // current page data
table.totalItems // total matching records
```
