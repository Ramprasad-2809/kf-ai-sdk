# useTable Hook - Usage Guide

The `useTable` hook is a powerful data table management solution that handles data fetching, sorting, searching, filtering, and pagination with minimal configuration. It integrates seamlessly with TanStack Query for efficient data management.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Features](#features)
  - [Sorting](#sorting)
  - [Searching](#searching)
  - [Advanced Filtering](#advanced-filtering)
  - [Pagination](#pagination)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Usage

```tsx
import { useTable } from 'kf-ai-sdk';

interface Product {
  _id: string;
  Title: string;
  Price: number;
  Category: string;
  Stock: number;
}

function ProductList() {
  const table = useTable<Product>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name", enableSorting: true },
      { fieldId: "Price", label: "Price", enableSorting: true },
      { fieldId: "Category", label: "Category" },
      { fieldId: "Stock", label: "Stock" },
    ],
    enablePagination: true,
  });

  if (table.isLoading) {
    return <div>Loading...</div>;
  }

  if (table.error) {
    return <div>Error: {table.error.message}</div>;
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((product) => (
            <tr key={product._id}>
              <td>{product.Title}</td>
              <td>${product.Price}</td>
              <td>{product.Category}</td>
              <td>{product.Stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
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
    </div>
  );
}
```

## Core Concepts

### Data Source
The `source` parameter identifies your backend data source (Business Object). The hook automatically fetches data from the API endpoint.

### Columns Configuration
Define which fields to display and their behavior:
- `fieldId`: The field name from your data type
- `label`: Display label (optional, defaults to fieldId)
- `enableSorting`: Allow sorting on this column
- `enableFiltering`: Allow filtering on this column
- `transform`: Custom render function for the cell value

### State Management
All table state (pagination, sorting, filtering, search) is managed internally and synchronized with the backend via API calls.

## API Reference

### useTable(options)

#### Parameters

```typescript
interface UseTableOptions<T> {
  /** Data source identifier (Business Object name) */
  source: string;

  /** Column configurations */
  columns: ColumnDefinition<T>[];

  /** Enable sorting functionality (default: false) */
  enableSorting?: boolean;

  /** Enable filtering functionality (default: false) */
  enableFiltering?: boolean;

  /** Enable pagination (default: false) */
  enablePagination?: boolean;

  /** Field definitions for filter validation */
  fieldDefinitions?: Record<keyof T, FieldDefinition>;

  /** Initial state */
  initialState?: {
    pagination?: {
      pageNo: number;      // 1-indexed page number
      pageSize: number;
    };
    sorting?: {
      field: keyof T;
      direction: "asc" | "desc";
    };
    globalFilter?: string;
    filters?: FilterConditionWithId[];
    filterOperator?: "AND" | "OR";
  };

  /** Error callback */
  onError?: (error: Error) => void;

  /** Success callback */
  onSuccess?: (data: T[]) => void;

  /** Filter error callback */
  onFilterError?: (errors: ValidationError[]) => void;
}

interface ColumnDefinition<T> {
  /** Field name from the data type */
  fieldId: keyof T;

  /** Display label (optional, defaults to fieldId) */
  label?: string;

  /** Enable sorting for this column */
  enableSorting?: boolean;

  /** Enable filtering for this column */
  enableFiltering?: boolean;

  /** Custom transform function for rendering */
  transform?: (value: any, row: T) => React.ReactNode;
}
```

#### Return Value

```typescript
interface UseTableReturn<T> {
  // Data
  rows: T[];                    // Current page rows
  totalItems: number;           // Total count across all pages

  // Loading States
  isLoading: boolean;           // Initial data load
  isFetching: boolean;          // Any data fetch (including refetch)

  // Error Handling
  error: Error | null;

  // Search
  search: {
    query: string;
    setQuery: (value: string) => void;
    clear: () => void;
  };

  // Sorting
  sort: {
    field: keyof T | null;
    direction: "asc" | "desc" | null;
    toggle: (field: keyof T) => void;
    clear: () => void;
  };

  // Advanced Filtering
  filter: {
    // State
    conditions: FilterConditionWithId[];
    logicalOperator: "AND" | "OR";
    isValid: boolean;
    validationErrors: ValidationError[];
    hasConditions: boolean;

    // Condition Management
    addCondition: (condition: Omit<FilterConditionWithId, "id" | "isValid">) => string;
    updateCondition: (id: string, updates: Partial<FilterConditionWithId>) => boolean;
    removeCondition: (id: string) => boolean;
    clearConditions: () => void;
    getCondition: (id: string) => FilterConditionWithId | undefined;

    // Logical Operator
    setLogicalOperator: (operator: "AND" | "OR") => void;

    // Utilities
    getConditionCount: () => number;
  };

  // Pagination
  pagination: {
    currentPage: number;        // 1-indexed
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
```

## Features

### Sorting

Enable sorting on specific columns and let users toggle sort direction.

```tsx
function ProductList() {
  const table = useTable<Product>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name", enableSorting: true },
      { fieldId: "Price", label: "Price", enableSorting: true },
      { fieldId: "Stock", label: "Stock", enableSorting: true },
    ],
    enableSorting: true,
    initialState: {
      sorting: { field: "Title", direction: "asc" }
    }
  });

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => table.sort.toggle("Title")}>
            Name {table.sort.field === "Title" && (
              table.sort.direction === "asc" ? "↑" : "↓"
            )}
          </th>
          <th onClick={() => table.sort.toggle("Price")}>
            Price {table.sort.field === "Price" && (
              table.sort.direction === "asc" ? "↑" : "↓"
            )}
          </th>
        </tr>
      </thead>
      {/* ... */}
    </table>
  );
}
```

**Sorting Behavior:**
- Click once: Sort ascending
- Click twice: Sort descending
- Click thrice: Clear sorting

### Searching

Full-text search across your data.

```tsx
import { Search } from "lucide-react";

function ProductList() {
  const table = useTable<Product>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name" },
      { fieldId: "Category", label: "Category" },
    ],
    enablePagination: true,
  });

  return (
    <div>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
        <input
          placeholder="Search products..."
          className="pl-10"
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
        />
        {table.search.query && (
          <button onClick={table.search.clear}>Clear</button>
        )}
      </div>

      {/* Results */}
      <p>Found {table.totalItems} results</p>

      {/* Table */}
      {/* ... */}
    </div>
  );
}
```

**Search Features:**
- Automatically resets to page 1 when search query changes
- Debounced API calls (via react-query)
- Case-insensitive search
- Searches across all fields (backend-controlled)

### Advanced Filtering

Build complex filter conditions with AND/OR logic.

```tsx
function ProductList() {
  const table = useTable<Product>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name" },
      { fieldId: "Price", label: "Price" },
      { fieldId: "Category", label: "Category" },
    ],
    enableFiltering: true,
  });

  const handleCategoryFilter = (category: string) => {
    // Clear existing filters
    table.filter.clearConditions();

    // Add category filter
    if (category !== "all") {
      table.filter.addCondition({
        lhsField: "Category",
        operator: "EQ",
        rhsValue: category,
        rhsType: "Constant",
      });
    }
  };

  const handlePriceRangeFilter = () => {
    // Add price range filter (between $25 and $100)
    table.filter.addCondition({
      lhsField: "Price",
      operator: "GTE",
      rhsValue: 25,
      rhsType: "Constant",
    });

    table.filter.addCondition({
      lhsField: "Price",
      operator: "LTE",
      rhsValue: 100,
      rhsType: "Constant",
    });

    // Combine with AND logic
    table.filter.setLogicalOperator("AND");
  };

  return (
    <div>
      {/* Category Filters */}
      <button onClick={() => handleCategoryFilter("Electronics")}>
        Electronics
      </button>
      <button onClick={() => handleCategoryFilter("Books")}>
        Books
      </button>
      <button onClick={() => handleCategoryFilter("all")}>
        All
      </button>

      {/* Price Range Filter */}
      <button onClick={handlePriceRangeFilter}>
        $25 - $100
      </button>

      {/* Clear All Filters */}
      {table.filter.hasConditions && (
        <button onClick={table.filter.clearConditions}>
          Clear Filters ({table.filter.getConditionCount()})
        </button>
      )}

      {/* Table */}
      {/* ... */}
    </div>
  );
}
```

**Filter Operators:**
- `EQ`: Equal
- `NEQ`: Not equal
- `GT`: Greater than
- `GTE`: Greater than or equal
- `LT`: Less than
- `LTE`: Less than or equal
- `CONTAINS`: String contains
- `STARTS_WITH`: String starts with
- `ENDS_WITH`: String ends with
- `IN`: Value in list
- `NOT_IN`: Value not in list

**Filter Condition Structure:**
```typescript
interface FilterCondition {
  lhsField: string;           // Left-hand side field name
  operator: FilterOperator;    // Comparison operator
  rhsValue: any;              // Right-hand side value
  rhsType: "Constant" | "Field";  // Value type
  rhsField?: string;          // For field-to-field comparison
}
```

### Pagination

Handle large datasets with built-in pagination.

```tsx
function ProductList() {
  const table = useTable<Product>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name" },
      { fieldId: "Price", label: "Price" },
    ],
    enablePagination: true,
    initialState: {
      pagination: {
        pageNo: 1,      // Start at page 1
        pageSize: 10    // 10 items per page
      }
    }
  });

  return (
    <div>
      {/* Table */}
      <table>
        {/* ... */}
        <tbody>
          {table.rows.map((product) => (
            <tr key={product._id}>
              <td>{product.Title}</td>
              <td>${product.Price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Info */}
      <div>
        Showing {(table.pagination.currentPage - 1) * table.pagination.pageSize + 1}
        {" "}to{" "}
        {Math.min(
          table.pagination.currentPage * table.pagination.pageSize,
          table.totalItems
        )}
        {" "}of {table.totalItems} products
      </div>

      {/* Pagination Controls */}
      <div>
        <button
          onClick={table.pagination.goToPrevious}
          disabled={!table.pagination.canGoPrevious}
        >
          Previous
        </button>

        <span>
          Page {table.pagination.currentPage} of {table.pagination.totalPages}
        </span>

        <button
          onClick={table.pagination.goToNext}
          disabled={!table.pagination.canGoNext}
        >
          Next
        </button>
      </div>

      {/* Page Size Selector */}
      <select
        value={table.pagination.pageSize}
        onChange={(e) => table.pagination.setPageSize(Number(e.target.value))}
      >
        <option value={10}>10 per page</option>
        <option value={25}>25 per page</option>
        <option value={50}>50 per page</option>
        <option value={100}>100 per page</option>
      </select>
    </div>
  );
}
```

**Pagination Features:**
- 1-indexed pages (page 1, 2, 3, not 0, 1, 2)
- Automatic page reset when filters/search change
- Efficient server-side pagination
- Total count tracked separately for accuracy

## Complete Example

Here's a full-featured product list with all features enabled:

```tsx
import { useState } from "react";
import { useTable } from "kf-ai-sdk";
import { Search, Filter, X } from "lucide-react";

interface Product {
  _id: string;
  Title: string;
  Description: string;
  Price: number;
  Category: string;
  Stock: number;
  Brand: string;
}

const categories = ["Electronics", "Clothing", "Books", "Home", "Sports"];

export function ProductListPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const table = useTable<Product>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", label: "Name", enableSorting: true },
      { fieldId: "Price", label: "Price", enableSorting: true },
      { fieldId: "Category", label: "Category", enableSorting: true },
      { fieldId: "Stock", label: "Stock", enableSorting: true },
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "Title", direction: "asc" },
    },
    onError: (error) => {
      console.error("Table error:", error);
    },
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    table.filter.clearConditions();

    if (category !== "all") {
      table.filter.addCondition({
        lhsField: "Category",
        operator: "EQ",
        rhsValue: category,
        rhsType: "Constant",
      });
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>Products</h1>
        <p>{table.totalItems} items found</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search className="icon" />
        <input
          placeholder="Search products..."
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
        />
        {table.search.query && (
          <button onClick={table.search.clear}>
            <X className="icon" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters">
        <h3>Category</h3>
        <button
          className={selectedCategory === "all" ? "active" : ""}
          onClick={() => handleCategoryChange("all")}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={selectedCategory === cat ? "active" : ""}
            onClick={() => handleCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}

        {table.filter.hasConditions && (
          <button onClick={table.filter.clearConditions}>
            Clear Filters ({table.filter.getConditionCount()})
          </button>
        )}
      </div>

      {/* Loading State */}
      {table.isLoading ? (
        <div className="loading">Loading...</div>
      ) : table.error ? (
        <div className="error">
          <h3>Error loading products</h3>
          <p>{table.error.message}</p>
          <button onClick={() => table.refetch()}>Try Again</button>
        </div>
      ) : table.rows.length === 0 ? (
        <div className="empty">
          <Filter className="icon" />
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
          <button
            onClick={() => {
              table.search.clear();
              table.filter.clearConditions();
              setSelectedCategory("all");
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* Table */}
          <table>
            <thead>
              <tr>
                <th onClick={() => table.sort.toggle("Title")}>
                  Product
                  {table.sort.field === "Title" && (
                    <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th onClick={() => table.sort.toggle("Category")}>
                  Category
                  {table.sort.field === "Category" && (
                    <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th onClick={() => table.sort.toggle("Price")}>
                  Price
                  {table.sort.field === "Price" && (
                    <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
                <th onClick={() => table.sort.toggle("Stock")}>
                  Stock
                  {table.sort.field === "Stock" && (
                    <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div>
                      <strong>{product.Title}</strong>
                      <p>{product.Description}</p>
                    </div>
                  </td>
                  <td>
                    <span className="badge">{product.Category}</span>
                  </td>
                  <td>${product.Price.toFixed(2)}</td>
                  <td>
                    <span
                      className={
                        product.Stock > 10
                          ? "stock-good"
                          : product.Stock > 0
                          ? "stock-low"
                          : "stock-out"
                      }
                    >
                      {product.Stock} in stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing{" "}
              {(table.pagination.currentPage - 1) * table.pagination.pageSize + 1}{" "}
              to{" "}
              {Math.min(
                table.pagination.currentPage * table.pagination.pageSize,
                table.totalItems
              )}{" "}
              of {table.totalItems} products
            </div>

            <div className="pagination-controls">
              <button
                onClick={table.pagination.goToPrevious}
                disabled={!table.pagination.canGoPrevious}
              >
                Previous
              </button>

              <span>
                Page {table.pagination.currentPage} of{" "}
                {table.pagination.totalPages}
              </span>

              <button
                onClick={table.pagination.goToNext}
                disabled={!table.pagination.canGoNext}
              >
                Next
              </button>
            </div>

            <select
              value={table.pagination.pageSize}
              onChange={(e) =>
                table.pagination.setPageSize(Number(e.target.value))
              }
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
```

## Best Practices

### 1. Always Define Types

Use TypeScript for better type safety and autocomplete:

```tsx
interface Product {
  _id: string;
  Title: string;
  Price: number;
  Category: string;
  Stock: number;
}

const table = useTable<Product>({
  source: "BDO_AmazonProductMaster",
  columns: [
    { fieldId: "Title", label: "Name" },  // TypeScript validates fieldId
    { fieldId: "Price", label: "Price" },
  ]
});
```

### 2. Handle Loading and Error States

Always show appropriate UI for loading and error states:

```tsx
if (table.isLoading) {
  return <LoadingSpinner />;
}

if (table.error) {
  return (
    <ErrorMessage
      message={table.error.message}
      onRetry={() => table.refetch()}
    />
  );
}
```

### 3. Show Empty States

Provide helpful empty states when no data matches:

```tsx
if (table.rows.length === 0) {
  return (
    <EmptyState
      title="No products found"
      description="Try adjusting your filters"
      onClearFilters={() => {
        table.search.clear();
        table.filter.clearConditions();
      }}
    />
  );
}
```

### 4. Reset to Page 1 on Filter Changes

The hook automatically resets to page 1 when:
- Search query changes
- Filters are added/removed/updated
- Sort changes

No manual intervention needed!

### 5. Use Initial State for Better UX

Set sensible defaults:

```tsx
const table = useTable({
  source: "BDO_AmazonProductMaster",
  columns: [...],
  initialState: {
    pagination: { pageNo: 1, pageSize: 10 },
    sorting: { field: "Title", direction: "asc" },  // Default sort
  }
});
```

### 6. Memoize Callbacks

When using callbacks, memoize them to prevent unnecessary re-renders:

```tsx
const handleError = useCallback((error: Error) => {
  toast.error(error.message);
}, []);

const table = useTable({
  source: "BDO_AmazonProductMaster",
  columns: [...],
  onError: handleError,
});
```

### 7. Combine Search and Filters

Search and filters work independently and are combined on the backend:

```tsx
// Both search AND category filter will be applied
table.search.setQuery("laptop");  // Searches for "laptop"
table.filter.addCondition({        // Within Electronics category
  lhsField: "Category",
  operator: "EQ",
  rhsValue: "Electronics",
  rhsType: "Constant",
});
```

## Common Patterns

### Pattern 1: Filter Sidebar

```tsx
function ProductListWithSidebar() {
  const table = useTable<Product>({...});

  return (
    <div className="layout">
      {/* Sidebar with filters */}
      <aside className="sidebar">
        <h3>Filters</h3>

        {/* Category Filter */}
        <div>
          <h4>Category</h4>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                table.filter.clearConditions();
                table.filter.addCondition({
                  lhsField: "Category",
                  operator: "EQ",
                  rhsValue: cat,
                  rhsType: "Constant",
                });
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Price Range */}
        <div>
          <h4>Price</h4>
          <input
            type="range"
            min="0"
            max="1000"
            onChange={(e) => {
              const maxPrice = Number(e.target.value);
              table.filter.addCondition({
                lhsField: "Price",
                operator: "LTE",
                rhsValue: maxPrice,
                rhsType: "Constant",
              });
            }}
          />
        </div>
      </aside>

      {/* Main content with table */}
      <main>
        {/* Table rendering */}
      </main>
    </div>
  );
}
```

### Pattern 2: Search with Debounce

The hook uses react-query which automatically debounces API calls, but you can add UI debounce:

```tsx
import { useDeferredValue } from "react";

function SearchableTable() {
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);

  const table = useTable<Product>({...});

  // Sync deferred value with table search
  useEffect(() => {
    table.search.setQuery(deferredSearch);
  }, [deferredSearch]);

  return (
    <input
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Pattern 3: Sortable Column Headers

```tsx
function SortableHeader({
  field,
  label,
  table
}: {
  field: keyof Product;
  label: string;
  table: ReturnType<typeof useTable<Product>>;
}) {
  const isSorted = table.sort.field === field;

  return (
    <th
      onClick={() => table.sort.toggle(field)}
      className="sortable"
    >
      {label}
      {isSorted && (
        <span className="sort-indicator">
          {table.sort.direction === "asc" ? "↑" : "↓"}
        </span>
      )}
    </th>
  );
}

// Usage
<thead>
  <tr>
    <SortableHeader field="Title" label="Name" table={table} />
    <SortableHeader field="Price" label="Price" table={table} />
    <SortableHeader field="Stock" label="Stock" table={table} />
  </tr>
</thead>
```

### Pattern 4: Bulk Actions with Selection

```tsx
function TableWithSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const table = useTable<Product>({...});

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(table.rows.map(r => r._id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className="bulk-actions">
          <p>{selectedIds.size} items selected</p>
          <button onClick={clearSelection}>Clear</button>
          <button>Delete Selected</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedIds.size === table.rows.length}
                onChange={selectAll}
              />
            </th>
            <th>Name</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map(row => (
            <tr key={row._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(row._id)}
                  onChange={() => toggleSelection(row._id)}
                />
              </td>
              <td>{row.Title}</td>
              <td>${row.Price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Troubleshooting

### Issue: Data Not Loading

**Symptoms:** Table shows loading state indefinitely

**Solutions:**
1. Check if the backend API endpoint is accessible
2. Verify the `source` parameter matches your backend Business Object
3. Check browser console for network errors
4. Use `onError` callback to log errors:

```tsx
const table = useTable({
  source: "BDO_AmazonProductMaster",
  columns: [...],
  onError: (error) => {
    console.error("Table error:", error);
  }
});
```

### Issue: Sorting Not Working

**Symptoms:** Clicking column headers doesn't sort data

**Solutions:**
1. Ensure `enableSorting: true` is set on the table
2. Verify individual columns have `enableSorting: true`
3. Check that the `sort.toggle()` function is called on click
4. Backend must support the `Sort` parameter in list API

### Issue: Filters Not Applied

**Symptoms:** Adding filters doesn't change displayed data

**Solutions:**
1. Ensure `enableFiltering: true` is set
2. Check filter condition structure is correct
3. Verify backend supports the `Filter` parameter
4. Use validation to catch filter errors:

```tsx
const table = useTable({
  source: "BDO_AmazonProductMaster",
  columns: [...],
  enableFiltering: true,
  onFilterError: (errors) => {
    console.error("Filter validation errors:", errors);
  }
});
```

### Issue: Pagination Shows Wrong Total

**Symptoms:** Total item count doesn't match actual data

**Solutions:**
- The hook fetches count separately for accuracy
- If count seems wrong, check backend count API endpoint
- Ensure filters are properly applied to count query

### Issue: Performance Issues with Large Datasets

**Symptoms:** Table is slow to render or update

**Solutions:**
1. Enable pagination to limit rows per page
2. Use smaller page sizes (10-25 items)
3. Implement virtual scrolling for very large tables
4. Optimize custom `transform` functions
5. Memoize row rendering components

```tsx
const ProductRow = memo(({ product }: { product: Product }) => (
  <tr>
    <td>{product.Title}</td>
    <td>${product.Price}</td>
  </tr>
));

// Use in table
{table.rows.map(product => (
  <ProductRow key={product._id} product={product} />
))}
```

### Issue: Search Triggers Too Many API Calls

**Symptoms:** API called on every keystroke

**Solutions:**
- React Query automatically batches and caches requests
- Adjust `staleTime` for less frequent refetches
- The hook is optimized for this - no action needed in most cases

---

For more examples, see the [e-commerce example](../examples/e-commerce/) in the repository.
