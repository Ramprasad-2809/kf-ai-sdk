# useBDOTable Hook

`useBDOTable` is a thin wrapper around the base `useTable` hook, designed for BDO (Business Data Object) tables. Instead of manually wiring up `queryKey`, `listFn`, and `countFn`, you pass a BDO instance directly and the hook handles the rest.

Internally, `useBDOTable` delegates to `useTable` by extracting `bdo.meta._id` for the query key and binding `bdo.list()` / `bdo.count()` as the data-fetching functions.

---

## Imports

```typescript
import { useBDOTable } from '@ram_28/kf-ai-sdk/table';
import type {
  UseBDOTableOptionsType,
  UseBDOTableReturnType,
} from '@ram_28/kf-ai-sdk/table/types';
```

---

## Type Definitions

### UseBDOTableOptionsType

```typescript
export interface UseBDOTableOptionsType<T> {
  /** BDO instance with list() and count() methods */
  bdo: {
    meta: { readonly _id: string; readonly name: string };
    list(options?: any): Promise<any>;
    count(options?: any): Promise<any>;
  };

  /** Initial state */
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<T>;
  };

  /** Error callback */
  onError?: (error: Error) => void;

  /** Success callback -- receives rows from current page */
  onSuccess?: (data: T[]) => void;
}
```

### UseBDOTableReturnType

```typescript
export type UseBDOTableReturnType<T> = UseTableReturnType<T>;
```

The return type is identical to `UseTableReturnType<T>`. All properties -- `rows`, `totalItems`, `isLoading`, `isFetching`, `error`, `search`, `sort`, `filter`, `pagination`, and `refetch` -- behave exactly as documented in `useTable`.

---

## Full Example

A complete product listing page using `useBDOTable` with a BDO instance.

```tsx
import { useMemo, useState } from 'react';
import { useBDOTable } from '@ram_28/kf-ai-sdk/table';
import { ConditionOperator, RHSType } from '@ram_28/kf-ai-sdk/filter';
import type { UseBDOTableReturnType } from '@ram_28/kf-ai-sdk/table/types';
import { BuyerProduct } from '../bdo/buyer/Product';
import type { BuyerProductFieldType } from '../bdo/buyer/Product';

function ProductListPage() {
  const productBdo = useMemo(() => new BuyerProduct(), []);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const table: UseBDOTableReturnType<BuyerProductFieldType> =
    useBDOTable<BuyerProductFieldType>({
      bdo: productBdo,
      initialState: {
        sort: [{ [productBdo.Title.id]: 'ASC' }],
        pagination: { pageNo: 1, pageSize: 10 },
      },
      onError: (error) => {
        console.error('Table fetch failed:', error.message);
      },
      onSuccess: (data) => {
        console.log('Loaded', data.length, 'rows');
      },
    });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    table.filter.clearAllConditions();
    if (category !== 'all') {
      table.filter.addCondition({
        LHSField: productBdo.Category.id,
        Operator: ConditionOperator.EQ,
        RHSValue: category,
        RHSType: RHSType.Constant,
      });
    }
  };

  if (table.isLoading) return <div>Loading...</div>;
  if (table.error) {
    return (
      <div>
        <p>Error: {table.error.message}</p>
        <button onClick={() => table.refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <input
        type='text'
        placeholder='Search products...'
        value={table.search.query}
        onChange={(e) => table.search.set(productBdo.Title.id, e.target.value)}
      />
      {table.search.query && (
        <button onClick={table.search.clear}>Clear Search</button>
      )}

      {/* Category Filter */}
      <select
        value={selectedCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
      >
        <option value='all'>All Categories</option>
        <option value='Electronics'>Electronics</option>
        <option value='Books'>Books</option>
      </select>

      {/* Sort */}
      <select
        onChange={(e) => {
          const [field, dir] = e.target.value.split(':');
          table.sort.set(field, dir as 'ASC' | 'DESC');
        }}
      >
        <option value={`${productBdo.Title.id}:ASC`}>Name A-Z</option>
        <option value={`${productBdo.Price.id}:ASC`}>Price: Low to High</option>
        <option value={`${productBdo.Price.id}:DESC`}>Price: High to Low</option>
      </select>

      {/* Results */}
      <p>{table.totalItems} results</p>
      <div>
        {table.rows.map((row) => (
          <div key={row._id}>
            <h3>{row.Title}</h3>
            <p>${row.Price}</p>
            <p>{row.Category}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
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

## Migration Guide: `useTable` to `useBDOTable`

If you are currently using `useTable` with a BDO's `meta._id` as the `source`, migrating to `useBDOTable` is straightforward.

### Before (useTable)

```typescript
import { useMemo } from 'react';
import { useTable } from '@ram_28/kf-ai-sdk/table';
import { BuyerProduct } from '../bdo/buyer/Product';
import type { BuyerProductFieldType } from '../bdo/buyer/Product';

function ProductsTable() {
  const product = useMemo(() => new BuyerProduct(), []);

  const table = useTable<BuyerProductFieldType>({
    queryKey: ['table', product.meta._id],
    listFn: (opts) => product.list(opts),
    countFn: (opts) => product.count(opts),
    initialState: {
      sort: [{ [product.Title.id]: 'ASC' }],
      pagination: { pageNo: 1, pageSize: 10 },
    },
  });

  // ...
}
```

### After (useBDOTable)

```typescript
import { useMemo } from 'react';
import { useBDOTable } from '@ram_28/kf-ai-sdk/table';
import { BuyerProduct } from '../bdo/buyer/Product';
import type { BuyerProductFieldType } from '../bdo/buyer/Product';

function ProductsTable() {
  const product = useMemo(() => new BuyerProduct(), []);

  const table = useBDOTable<BuyerProductFieldType>({
    bdo: product,
    initialState: {
      sort: [{ [product.Title.id]: 'ASC' }],
      pagination: { pageNo: 1, pageSize: 10 },
    },
  });

  // ...
}
```

### What changes

| Property | `useTable` | `useBDOTable` |
|----------|-----------|---------------|
| Data source | `queryKey` + `listFn` + `countFn` | `bdo` (single property) |
| Query key | Manual: `['table', bdo.meta._id]` | Automatic: derived from `bdo.meta._id` |
| List function | Manual: `(opts) => bdo.list(opts)` | Automatic: bound from `bdo.list()` |
| Count function | Manual: `(opts) => bdo.count(opts)` | Automatic: bound from `bdo.count()` |
| `initialState` | Same | Same |
| `onError` | Same | Same |
| `onSuccess` | Same | Same |
| Return type | `UseTableReturnType<T>` | `UseBDOTableReturnType<T>` (alias for `UseTableReturnType<T>`) |

### What stays the same

Everything after the hook call is identical. The return type is the same, so no changes are needed in your rendering logic, event handlers, or any code that reads from the table object.

---

## Search, Sort, Filter, and Pagination

These features work identically to the base `useTable` hook. `useBDOTable` passes the `initialState`, `onError`, and `onSuccess` options straight through to `useTable`, so all behavior is inherited.

Refer to the [useTable documentation](./useTable.md) for detailed examples of:

- **Search** -- `table.search.set(field, query)`, `table.search.clear()`, 300ms debounce
- **Sort** -- `table.sort.toggle(field)`, `table.sort.set(field, direction)`, `table.sort.clear()`
- **Filter** -- `table.filter.addCondition(...)`, `table.filter.removeCondition(...)`, `table.filter.clearAllConditions()`
- **Pagination** -- `table.pagination.goToNext()`, `table.pagination.goToPrevious()`, `table.pagination.goToPage(n)`, `table.pagination.setPageSize(n)`

---

## Common Mistakes

### 1. Passing `source` instead of `bdo`

`useBDOTable` takes a `bdo` instance, NOT a `source` string. If you want to pass a string, use `useTable` directly.

```typescript
// WRONG -- source is not a valid property on useBDOTable
useBDOTable({ source: product.meta._id });

// CORRECT -- pass the BDO instance
useBDOTable({ bdo: product });
```

### 2. Passing a raw object instead of a BDO instance

The `bdo` property expects an object with `meta`, `list()`, and `count()`. A plain object or entity type will not work.

```typescript
// WRONG -- plain object without list/count methods
useBDOTable({ bdo: { _id: 'BO_Product', name: 'Product' } });

// CORRECT -- a BDO class instance
const product = useMemo(() => new BuyerProduct(), []);
useBDOTable({ bdo: product });
```

### 3. Recreating the BDO on every render

Constructing the BDO inside the component body without `useMemo` creates a new instance on every render, which destabilizes the query key and causes infinite refetching.

```typescript
// WRONG -- new instance every render
function ProductsTable() {
  const product = new BuyerProduct();
  const table = useBDOTable({ bdo: product }); // infinite refetch loop
}

// CORRECT -- memoize the instance
function ProductsTable() {
  const product = useMemo(() => new BuyerProduct(), []);
  const table = useBDOTable({ bdo: product });
}
```

### 4. Using `columns` with useBDOTable

`useBDOTable` does not accept a `columns` property. Column definitions are a UI concern handled in your rendering logic, not in the hook options. This is the same as the base `useTable`.

```typescript
// WRONG -- columns is not a hook option
useBDOTable({
  bdo: product,
  columns: [{ fieldId: 'Title', label: 'Title' }],
});

// CORRECT -- define columns separately for rendering
const columns = [
  { fieldId: product.Title.id, label: product.Title.label },
  { fieldId: product.Price.id, label: product.Price.label },
];
const table = useBDOTable({ bdo: product });
```

### 5. Calling `.get()` on table rows

Table `rows` are plain objects, NOT `ItemType`. The `.get()` accessor is only available on items returned by `bdo.get()`, `bdo.create()`, or the `useForm` item proxy.

```typescript
// WRONG -- rows are plain objects, not ItemType
table.rows.map((row) => row.Title.get());

// CORRECT -- access properties directly
table.rows.map((row) => row.Title);
```

### 6. Wrong initialState property names

This is not react-table. Do not use react-table naming conventions.

```typescript
// WRONG -- sorting and pageIndex are react-table names
useBDOTable({
  bdo: product,
  initialState: { sorting: [...], pagination: { pageIndex: 0, pageSize: 10 } },
});

// CORRECT -- use sort and pageNo (1-indexed)
useBDOTable({
  bdo: product,
  initialState: {
    sort: [{ [product.Title.id]: 'ASC' }],
    pagination: { pageNo: 1, pageSize: 10 },
  },
});
```
