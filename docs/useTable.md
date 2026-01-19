# useTable Hook Documentation

The `useTable` hook provides data fetching, sorting, searching, filtering, and pagination for tables.

## Table of Contents

- [Type Reference](#type-reference)
- [Usage Example](#usage-example)
- [API Quick Reference](#api-quick-reference)

## Type Reference

### Import Types

```typescript
import { useTable } from "@ram_28/kf-ai-sdk";
import type {
  UseTableOptions,
  UseTableReturn,
  ColumnDefinition,
  FilterConditionWithId,
  ValidationError,
  ListResponse,
  LogicalOperator,
} from "@ram_28/kf-ai-sdk";
```

### ColumnDefinition<T>

Configuration for table columns.

```typescript
interface ColumnDefinition<T> {
  fieldId: keyof T;                              // Field from your data type
  label?: string;                                // Display label
  enableSorting?: boolean;                       // Allow sorting
  enableFiltering?: boolean;                     // Allow filtering
  transform?: (value: any, row: T) => ReactNode; // Custom render
}
```

### UseTableOptions<T>

```typescript
interface UseTableOptions<T> {
  source: string;                    // Business Object ID
  columns: ColumnDefinition<T>[];    // Column configs
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  initialState?: {
    pagination?: { pageNo: number; pageSize: number };
    sorting?: { field: keyof T; direction: "asc" | "desc" };
    filters?: FilterConditionWithId[];
    filterOperator?: LogicalOperator;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
  onFilterError?: (errors: ValidationError[]) => void;
}
```

### UseTableReturn<T>

```typescript
interface UseTableReturn<T> {
  // Data
  rows: T[];
  totalItems: number;

  // Loading
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;

  // Search
  search: {
    query: string;
    setQuery: (value: string) => void;
    clear: () => void;
  };

  // Sort
  sort: {
    field: keyof T | null;
    direction: "asc" | "desc" | null;
    toggle: (field: keyof T) => void;
    clear: () => void;
  };

  // Filter (see useFilter docs for full API)
  filter: {
    conditions: FilterConditionWithId[];
    logicalOperator: LogicalOperator;
    isValid: boolean;
    validationErrors: ValidationError[];
    hasConditions: boolean;
    addCondition: (condition: Omit<FilterConditionWithId, "id" | "isValid">) => string;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    setLogicalOperator: (operator: LogicalOperator) => void;
    getConditionCount: () => number;
  };

  // Pagination
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
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
```

### ListResponse<T>

API response structure returned by `refetch()`.

```typescript
interface ListResponse<T> {
  Data: T[];
}
```

## Usage Example

From `ecommerce-app/src/pages/SellerProductsPage.tsx`. This example demonstrates all imported types:

```tsx
import { useState } from "react";
import { useTable } from "@ram_28/kf-ai-sdk";
import type {
  UseTableOptions,
  UseTableReturn,
  ColumnDefinition,
  FilterConditionWithId,
  ValidationError,
  ListResponse,
  LogicalOperator,
} from "@ram_28/kf-ai-sdk";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

// ProductType<TRole> - conditional type mapping role to field permissions
type SellerProduct = ProductType<typeof Roles.Seller>;

export function SellerProductsPage() {
  const product = new Product(Roles.Seller);
  const [savedFilters, setSavedFilters] = useState<FilterConditionWithId[]>([]);

  // ColumnDefinition<T> - defines table columns with type-safe fieldId
  const columns: ColumnDefinition<SellerProduct>[] = [
    { fieldId: "Title", label: "Name", enableSorting: true },
    { fieldId: "Price", label: "Price", enableSorting: true },
    { fieldId: "Category", label: "Category", enableSorting: true },
    { fieldId: "Stock", label: "Stock", enableSorting: true },
  ];

  // UseTableOptions<T> - configuration for the hook
  const tableOptions: UseTableOptions<SellerProduct> = {
    source: product._id,  // "BDO_AmazonProductMaster"
    columns,
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "_created_at", direction: "desc" },
      // LogicalOperator - how filter conditions are combined
      filterOperator: "And" as LogicalOperator,
    },
    // ValidationError[] - called when filter validation fails
    onFilterError: (errors: ValidationError[]) => {
      errors.forEach((err: ValidationError) => {
        console.error(`Filter error [${err.conditionId}]: ${err.field} - ${err.message}`);
      });
    },
    onError: (error: Error) => {
      console.error("Table error:", error.message);
    },
  };

  // UseTableReturn<T> - the hook return type with all methods
  const table: UseTableReturn<SellerProduct> = useTable<SellerProduct>(tableOptions);

  // Add a filter condition
  const filterByCategory = (category: string) => {
    table.filter.clearConditions();
    table.filter.addCondition({
      operator: "EQ",
      lhsField: "Category",
      rhsValue: category,
    });
  };

  // FilterConditionWithId - internal condition with ID and validation state
  const displayActiveFilters = () => {
    const conditions: FilterConditionWithId[] = table.filter.conditions;
    return conditions.map((condition: FilterConditionWithId) => (
      <span key={condition.id}>
        {condition.lhsField} {condition.operator} {condition.rhsValue}
        {!condition.isValid && " (invalid)"}
        <button onClick={() => table.filter.removeCondition(condition.id)}>×</button>
      </span>
    ));
  };

  // LogicalOperator - toggle between And/Or
  const toggleFilterLogic = () => {
    const current: LogicalOperator = table.filter.logicalOperator;
    const next: LogicalOperator = current === "And" ? "Or" : "And";
    table.filter.setLogicalOperator(next);
  };

  // ListResponse<T> - returned by refetch()
  const handleRefresh = async () => {
    const response: ListResponse<SellerProduct> = await table.refetch();
    console.log(`Refreshed: ${response.Data.length} items`);
  };

  // Save/restore filters using FilterConditionWithId[]
  const saveFilters = () => setSavedFilters([...table.filter.conditions]);
  const restoreFilters = () => table.filter.setConditions(savedFilters);

  return (
    <div>
      {/* Search */}
      <input
        placeholder="Search products..."
        value={table.search.query}
        onChange={(e) => table.search.setQuery(e.target.value)}
      />

      {/* Filter Controls */}
      <div>
        <button onClick={() => filterByCategory("Electronics")}>Electronics</button>
        <button onClick={() => filterByCategory("Books")}>Books</button>
        <button onClick={toggleFilterLogic}>
          Logic: {table.filter.logicalOperator}
        </button>
        {table.filter.hasConditions && (
          <button onClick={table.filter.clearConditions}>
            Clear ({table.filter.getConditionCount()})
          </button>
        )}
      </div>

      {/* Active Filters */}
      <div>{displayActiveFilters()}</div>

      {/* Validation Errors */}
      {table.filter.validationErrors.map((err: ValidationError) => (
        <div key={err.conditionId} className="error">{err.message}</div>
      ))}

      {/* Loading/Error States */}
      {table.isLoading && <div>Loading...</div>}
      {table.error && <div>Error: {table.error.message}</div>}

      {/* Table */}
      <table>
        <thead>
          <tr>
            {columns.map((col: ColumnDefinition<SellerProduct>) => (
              <th
                key={String(col.fieldId)}
                onClick={() => col.enableSorting && table.sort.toggle(col.fieldId)}
              >
                {col.label || String(col.fieldId)}
                {table.sort.field === col.fieldId && (
                  table.sort.direction === "asc" ? " ↑" : " ↓"
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: SellerProduct) => (
            <tr key={row._id}>
              <td>{row.Title}</td>
              <td>${row.Price}</td>
              <td>{row.Category}</td>
              <td>{row.Stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <span>
          Page {table.pagination.currentPage} of {table.pagination.totalPages}
          ({table.totalItems} total)
        </span>
        <button
          onClick={table.pagination.goToPrevious}
          disabled={!table.pagination.canGoPrevious}
        >
          Previous
        </button>
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
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Save/Restore/Refresh */}
      <div>
        <button onClick={saveFilters}>Save Filters</button>
        <button onClick={restoreFilters}>Restore Filters</button>
        <button onClick={handleRefresh}>Refresh</button>
      </div>
    </div>
  );
}
```

**Type explanations:**

| Type | Purpose | Where Used |
|------|---------|------------|
| `ColumnDefinition<T>` | Column config with type-safe `fieldId` | `columns` array |
| `UseTableOptions<T>` | Hook configuration | `useTable(options)` |
| `UseTableReturn<T>` | Hook return with all methods | Return value of `useTable()` |
| `FilterConditionWithId` | Filter condition with ID and validation | `table.filter.conditions`, saved filters |
| `ValidationError` | Filter validation error info | `table.filter.validationErrors`, `onFilterError` |
| `LogicalOperator` | "And" \| "Or" \| "Not" | `table.filter.logicalOperator` |
| `ListResponse<T>` | API response structure | Return value of `table.refetch()` |

## API Quick Reference

### Search

```typescript
table.search.query              // Current search string
table.search.setQuery("text")   // Set search (auto-resets to page 1)
table.search.clear()            // Clear search
```

### Sort

```typescript
table.sort.field                // Current sort field or null
table.sort.direction            // "asc" | "desc" | null
table.sort.toggle("Price")      // Toggle sort (asc → desc → none)
table.sort.clear()              // Clear sorting
```

### Filter

```typescript
table.filter.conditions                       // FilterConditionWithId[]
table.filter.logicalOperator                  // "And" | "Or"
table.filter.addCondition({ operator, lhsField, rhsValue })
table.filter.removeCondition(id)
table.filter.clearConditions()
table.filter.setLogicalOperator("Or")
table.filter.hasConditions                    // boolean
table.filter.getConditionCount()              // number
```

### Pagination

```typescript
table.pagination.currentPage    // 1-indexed
table.pagination.pageSize
table.pagination.totalPages
table.pagination.canGoNext      // boolean
table.pagination.canGoPrevious  // boolean
table.pagination.goToNext()
table.pagination.goToPrevious()
table.pagination.goToPage(3)
table.pagination.setPageSize(25)
```

### Data & State

```typescript
table.rows                      // T[] - current page data
table.totalItems                // Total count across all pages
table.isLoading                 // Initial load
table.isFetching                // Any fetch (including refetch)
table.error                     // Error | null
table.refetch()                 // Returns Promise<ListResponse<T>>
```
