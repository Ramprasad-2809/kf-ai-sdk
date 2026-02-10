# Table SDK API

This Table SDK API proivdes the React-hooks and apis to build Table and any List like component when building the Pages.

Here is the complete exmaple of building table with state management with data fetching, sorting, filtering, search, and pagination.

You SHOULD only use this API to build Table, List, Galllary, any other list like component.

## Imports

```typescript
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type {
  UseTableOptionsType,
  UseTableReturnType,
  ColumnDefinitionType,
  PaginationStateType,
} from "@ram_28/kf-ai-sdk/table/types";
```

## Type Definitions

### UseTableOptionsType

```typescript
// Hook options for initializing the table
interface UseTableOptionsType<T> {
  // Business Object ID (required)
  // Example: "BDO_Product", "BDO_Order"
  source: string;

  // Column configurations (required)
  // Defines which fields to display and their behavior
  columns: ColumnDefinitionType<T>[];

  // Initial state for the table (optional)
  initialState?: {
    // Initial sort configuration
    // Format: [{ "fieldName": "ASC" }] or [{ "fieldName": "DESC" }]
    sort?: SortType;

    // Initial pagination
    // Defaults: { pageNo: 1, pageSize: 10 }
    pagination?: PaginationStateType;

    // Initial filter conditions
    // See useFilter docs for full options
    filter?: UseFilterOptionsType<T>;
  };

  // Called when data fetch fails
  onError?: (error: Error) => void;

  // Called with fetched data after successful load
  onSuccess?: (data: T[]) => void;
}
```

### ColumnDefinitionType

```typescript
// Column configuration for table display
interface ColumnDefinitionType<T> {
  // Field name from the data type (required)
  fieldId: keyof T;

  // Display label for column header
  // Defaults to fieldId if not provided
  label?: string;

  // Enable sorting for this column
  // When true, column header is clickable to toggle sort
  enableSorting?: boolean;

  // Enable filtering for this column
  // When true, column can be used in filter conditions
  enableFiltering?: boolean;

  // Custom value transformer for display
  // Receives raw value and full row, returns rendered content
  transform?: (value: any, row: T) => React.ReactNode;
}
```

### UseTableReturnType

```typescript
// Hook return type with all table state and methods
interface UseTableReturnType<T> {
  // ============================================================
  // DATA
  // ============================================================

  // Current page data (array of records)
  rows: T[];

  // Total matching records across all pages
  totalItems: number;

  // ============================================================
  // LOADING STATES
  // ============================================================

  // True during initial load
  isLoading: boolean;

  // True during background refetch
  isFetching: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  // Current error state, null when no error
  error: Error | null;

  // ============================================================
  // SEARCH (field-based search using filter conditions)
  // ============================================================

  search: {
    // Current search query string
    query: string;

    // Field being searched, null if no search active
    field: keyof T | null;

    // Set search field and query (triggers API call, 300ms debounced)
    // Internally creates a Contains filter condition
    set: (field: keyof T, query: string) => void;

    // Clear search and reset to empty string (triggers API call)
    clear: () => void;
  };

  // ============================================================
  // SORT (single column sorting)
  // ============================================================

  sort: {
    // Currently sorted field, null if no sort active
    field: keyof T | null;

    // Current sort direction, null if no sort active
    direction: "asc" | "desc" | null;

    // Toggle sort on a field (triggers API call)
    // Cycles: none → asc → desc → none
    toggle: (field: keyof T) => void;

    // Clear sorting (triggers API call)
    clear: () => void;

    // Set explicit sort field and direction (triggers API call)
    set: (field: keyof T, direction: "asc" | "desc") => void;
  };

  // ============================================================
  // FILTER (see useFilter docs for full API)
  // ============================================================

  // Full useFilter return type
  // Includes addCondition, removeCondition, clearAllConditions, etc.
  filter: UseFilterReturnType<T>;

  // ============================================================
  // PAGINATION (1-indexed pages)
  // ============================================================

  pagination: {
    // Current page number (1-indexed, starts at 1)
    pageNo: number;

    // Number of items per page
    pageSize: number;

    // Total number of pages
    totalPages: number;

    // Total matching records (same as top-level totalItems)
    totalItems: number;

    // True if there's a next page available
    canGoNext: boolean;

    // True if there's a previous page available
    canGoPrevious: boolean;

    // Navigate to next page
    goToNext: () => void;

    // Navigate to previous page
    goToPrevious: () => void;

    // Navigate to specific page number (1-indexed)
    goToPage: (page: number) => void;

    // Change items per page (resets to page 1)
    setPageSize: (size: number) => void;
  };

  // ============================================================
  // OPERATIONS
  // ============================================================

  // Manually trigger data refetch
  // Returns promise with the list response
  refetch: () => Promise<ListResponseType<T>>;
}
```

### PaginationStateType

```typescript
// Pagination state for initial configuration
interface PaginationStateType {
  // Page number (1-indexed)
  pageNo: number;

  // Number of items per page
  pageSize: number;
}
```

## Basic Example

A minimal table displaying data with loading and error states.

```tsx
import { useMemo } from "react";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type { ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function ProductsTable() {
  const product = useMemo(() => new BuyerProduct(), []);

  const columns: ColumnDefinitionType<BuyerProductFieldType>[] = [
    { fieldId: product.Title.meta.id, label: product.Title.meta.label },
    { fieldId: product.Price.meta.id, label: product.Price.meta.label },
    { fieldId: product.Category.meta.id, label: product.Category.meta.label },
  ];

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  if (table.isLoading) return <div>Loading...</div>;
  if (table.error) return <div>Error: {table.error.message}</div>;

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.fieldId)}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row._id}>
            <td>{row.Title}</td>
            <td>${row.Price}</td>
            <td>{row.Category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Initial State

### Table with Initial Configuration

Set default pagination, sorting, and filters when the table loads.

```tsx
import { useMemo } from "react";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import { useAuth } from "@ram_28/kf-ai-sdk/auth";
import { ConditionOperator, RHSType, GroupOperator } from "@ram_28/kf-ai-sdk/filter";
import type {
  UseTableOptionsType,
  UseTableReturnType,
  ColumnDefinitionType,
} from "@ram_28/kf-ai-sdk/table/types";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function MyItemsTable() {
  const product = useMemo(() => new BuyerProduct(), []);
  const { user } = useAuth();

  const columns: ColumnDefinitionType<BuyerProductFieldType>[] = [
    { fieldId: product.Title.meta.id, label: product.Title.meta.label, enableSorting: true },
    { fieldId: product.Price.meta.id, label: product.Price.meta.label, enableSorting: true },
    { fieldId: product.Category.meta.id, label: product.Category.meta.label, enableSorting: true },
    { fieldId: product.Stock.meta.id, label: product.Stock.meta.label, enableSorting: true },
  ];

  const tableOptions: UseTableOptionsType<BuyerProductFieldType> = {
    source: product.meta._id,
    columns,
    initialState: {
      sort: [{ [product.Title.meta.id]: "ASC" }],
      pagination: { pageNo: 1, pageSize: 10 },
      filter: {
        conditions: [
          {
            Operator: ConditionOperator.EQ,
            LHSField: "_created_by",  // System field
            RHSValue: user._id,
            RHSType: RHSType.Constant,
          },
        ],
        operator: GroupOperator.And,
      },
    },
  };

  const table: UseTableReturnType<BuyerProductFieldType> =
    useTable<BuyerProductFieldType>(tableOptions);

  if (table.isLoading) return <div>Loading...</div>;

  return (
    <div>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.fieldId)}
                onClick={() =>
                  col.enableSorting && table.sort.toggle(col.fieldId)
                }
                style={{ cursor: col.enableSorting ? "pointer" : "default" }}
              >
                {col.label}
                {table.sort.field === col.fieldId && (
                  <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id}>
              <td>{row.Title}</td>
              <td>${row.Price}</td>
              <td>{row.Category}</td>
              <td>{row.Stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
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

## Filter

### Status Filter

Dropdown-based status filtering.

```tsx
import { useMemo } from "react";
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function ProductsWithStatusFilter() {
  const product = useMemo(() => new BuyerProduct(), []);

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    table.filter.clearAllConditions();

    if (status !== "all") {
      table.filter.addCondition({
        Operator: ConditionOperator.EQ,
        LHSField: product.IsActive.meta.id,
        RHSValue: status === "active",
        RHSType: RHSType.Constant,
      });
    }
  };

  return (
    <div>
      <select onChange={handleStatusChange} defaultValue="all">
        <option value="all">All Products</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      {/* table rendering */}
    </div>
  );
}
```

### Multiple Filters Combined

Apply category and price range filters together.

```tsx
import { useMemo, useState } from "react";
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

const PRICE_RANGES = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200, max: null },
] as const;

function ProductsWithMultipleFilters() {
  const product = useMemo(() => new BuyerProduct(), []);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(
    null,
  );

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  // Helper to apply all active filters
  const applyFilters = (category: string, priceRange: string | null) => {
    table.filter.clearAllConditions();

    // Apply category filter
    if (category !== "all") {
      table.filter.addCondition({
        LHSField: product.Category.meta.id,
        Operator: ConditionOperator.EQ,
        RHSValue: category,
        RHSType: RHSType.Constant,
      });
    }

    // Apply price filter
    if (priceRange) {
      const range = PRICE_RANGES.find((r) => r.label === priceRange);
      if (range) {
        if (range.max === null) {
          // "$200 & Above" - use GTE
          table.filter.addCondition({
            Operator: ConditionOperator.GTE,
            LHSField: product.Price.meta.id,
            RHSValue: range.min,
            RHSType: RHSType.Constant,
          });
        } else if (range.min === 0) {
          // "Under $25" - use LT
          table.filter.addCondition({
            Operator: ConditionOperator.LT,
            LHSField: product.Price.meta.id,
            RHSValue: range.max,
            RHSType: RHSType.Constant,
          });
        } else {
          // Range like "$25 to $50" - use Between
          table.filter.addCondition({
            LHSField: product.Price.meta.id,
            Operator: ConditionOperator.Between,
            RHSValue: [range.min, range.max],
            RHSType: RHSType.Constant,
          });
        }
      }
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    applyFilters(category, selectedPriceRange);
  };

  const handlePriceChange = (priceRange: string | null) => {
    setSelectedPriceRange(priceRange);
    applyFilters(selectedCategory, priceRange);
  };

  return (
    <div>
      <select
        value={selectedCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
      >
        <option value="all">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Books">Books</option>
      </select>

      <select
        value={selectedPriceRange || ""}
        onChange={(e) => handlePriceChange(e.target.value || null)}
      >
        <option value="">Any Price</option>
        {PRICE_RANGES.map((range) => (
          <option key={range.label} value={range.label}>
            {range.label}
          </option>
        ))}
      </select>

      {/* table rendering */}
    </div>
  );
}
```

---

## Sort

### Column Sort Toggle

Click column headers to toggle sort direction.

```tsx
import { useMemo } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function SortableTable() {
  const product = useMemo(() => new BuyerProduct(), []);

  const columns: ColumnDefinitionType<BuyerProductFieldType>[] = [
    { fieldId: product.Title.meta.id, label: product.Title.meta.label, enableSorting: true },
    { fieldId: product.Price.meta.id, label: product.Price.meta.label, enableSorting: true },
    { fieldId: product.Category.meta.id, label: product.Category.meta.label, enableSorting: true },
  ];

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.fieldId)}
              onClick={() =>
                col.enableSorting && table.sort.toggle(col.fieldId)
              }
              style={{ cursor: col.enableSorting ? "pointer" : "default" }}
            >
              {col.label}
              {table.sort.field === col.fieldId && (
                <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row._id}>
            <td>{row.Title}</td>
            <td>${row.Price}</td>
            <td>{row.Category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Sort Dropdown

Allow users to select sort order from a dropdown.

```tsx
import { useMemo, useState } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function TableWithSortDropdown() {
  const product = useMemo(() => new BuyerProduct(), []);
  const [selectedSort, setSelectedSort] = useState("featured");

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
    initialState: {
      sort: [{ [product.Title.meta.id]: "ASC" }],
    },
  });

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    switch (value) {
      case "price-asc":
        table.sort.set(product.Price.meta.id, "asc");
        break;
      case "price-desc":
        table.sort.set(product.Price.meta.id, "desc");
        break;
      case "newest":
        table.sort.set("_created_at", "desc");  // System field
        break;
      case "featured":
      default:
        table.sort.set(product.Title.meta.id, "asc");
        break;
    }
  };

  return (
    <div>
      <select
        value={selectedSort}
        onChange={(e) => handleSortChange(e.target.value)}
      >
        <option value="featured">Featured</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="newest">Newest Arrivals</option>
      </select>
      {/* table rendering */}
    </div>
  );
}
```

---

## Pagination

### Basic Pagination Controls

Navigate between pages with previous/next buttons.

```tsx
import { useMemo } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function PaginatedTable() {
  const product = useMemo(() => new BuyerProduct(), []);

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
    },
  });

  return (
    <div>
      {/* table rendering */}

      <div className="pagination">
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

      <p>{table.pagination.totalItems} total items</p>
    </div>
  );
}
```

### Page Size Selector

Allow users to change the number of items per page.

```tsx
import { useMemo } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function TableWithPageSize() {
  const product = useMemo(() => new BuyerProduct(), []);

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  return (
    <div>
      {/* table rendering */}

      <div className="pagination">
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
          <option value={100}>100 per page</option>
        </select>
      </div>
    </div>
  );
}
```

### Jump to Page

Allow users to navigate directly to a specific page.

```tsx
import { useMemo, useState } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function TableWithPageJump() {
  const product = useMemo(() => new BuyerProduct(), []);
  const [pageInput, setPageInput] = useState("");

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  const handlePageJump = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput, 10);
      if (page >= 1 && page <= table.pagination.totalPages) {
        table.pagination.goToPage(page);
        setPageInput("");
      }
    }
  };

  return (
    <div>
      {/* table rendering */}

      <div className="pagination">
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

        <input
          type="number"
          min={1}
          max={table.pagination.totalPages}
          placeholder="Go to page"
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onKeyDown={handlePageJump}
        />
      </div>
    </div>
  );
}
```

---

## Search

Search by field with filter-based implementation. The search internally creates a `Contains` filter condition for the specified field.

### API

- `search.query: string` - Current search query string
- `search.field: keyof T | null` - Field being searched
- `search.set(field, query)` - Set search field and query (triggers API call, 300ms debounced)
- `search.clear()` - Clear search (triggers API call)

### Basic Search

Add search functionality to filter results by a specific field. The search has built-in debouncing (300ms).

```tsx
import { useMemo } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function SearchableTable() {
  const product = useMemo(() => new BuyerProduct(), []);

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={table.search.query}
          onChange={(e) => table.search.set(product.Title.meta.id, e.target.value)}
        />
        {table.search.query && (
          <button onClick={table.search.clear}>Clear</button>
        )}
        {table.isFetching && <span>Searching...</span>}
      </div>

      {/* table rendering */}
    </div>
  );
}
```

### Search with Field Selector

Allow users to choose which field to search:

```tsx
import { useMemo, useState } from "react";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function SearchableTableWithFieldSelector() {
  const product = useMemo(() => new BuyerProduct(), []);
  const [searchField, setSearchField] = useState<string>(product.Title.meta.id);

  const table = useTable<BuyerProductFieldType>({
    source: product.meta._id,
    columns,
  });

  return (
    <div>
      <div className="search-bar">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            // Re-apply search with new field if there's an existing query
            if (table.search.query) {
              table.search.set(e.target.value, table.search.query);
            }
          }}
        >
          <option value={product.Title.meta.id}>{product.Title.meta.label}</option>
          <option value={product.Category.meta.id}>{product.Category.meta.label}</option>
          <option value={product.Description.meta.id}>{product.Description.meta.label}</option>
        </select>
        <input
          type="text"
          placeholder={`Search by ${searchField}...`}
          value={table.search.query}
          onChange={(e) => table.search.set(searchField, e.target.value)}
        />
        {table.search.query && (
          <button onClick={table.search.clear}>Clear</button>
        )}
      </div>

      {/* table rendering */}
    </div>
  );
}
```

---

## Complete Example

A full-featured product listing page with filters, search, sort, and pagination.

```tsx
import { useMemo, useState } from "react";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
import type {
  UseTableOptionsType,
  UseTableReturnType,
  ColumnDefinitionType,
} from "@ram_28/kf-ai-sdk/table/types";
import { BuyerProduct } from "../bdo/buyer/Product";
import type { BuyerProductFieldType } from "../bdo/buyer/Product";

function ProductListPage() {
  const product = useMemo(() => new BuyerProduct(), []);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("featured");

  const columns: ColumnDefinitionType<BuyerProductFieldType>[] = [
    { fieldId: product.Title.meta.id, label: product.Title.meta.label, enableSorting: true },
    { fieldId: product.Price.meta.id, label: product.Price.meta.label, enableSorting: true },
    { fieldId: product.Category.meta.id, label: product.Category.meta.label, enableSorting: true },
    { fieldId: product.Stock.meta.id, label: product.Stock.meta.label, enableSorting: true },
  ];

  const tableOptions: UseTableOptionsType<BuyerProductFieldType> = {
    source: product.meta._id,
    columns,
    initialState: {
      sort: [{ [product.Title.meta.id]: "ASC" }],
      pagination: { pageNo: 1, pageSize: 10 },
    },
  };

  const table: UseTableReturnType<BuyerProductFieldType> =
    useTable<BuyerProductFieldType>(tableOptions);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    table.filter.clearAllConditions();
    if (category !== "all") {
      table.filter.addCondition({
        LHSField: product.Category.meta.id,
        Operator: ConditionOperator.EQ,
        RHSValue: category,
        RHSType: RHSType.Constant,
      });
    }
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    switch (value) {
      case "price-asc":
        table.sort.set(product.Price.meta.id, "asc");
        break;
      case "price-desc":
        table.sort.set(product.Price.meta.id, "desc");
        break;
      case "newest":
        table.sort.set("_created_at", "desc");  // System field
        break;
      default:
        table.sort.set(product.Title.meta.id, "asc");
        break;
    }
  };

  if (table.error) {
    return (
      <div>
        <p>Error: {table.error.message}</p>
        <button onClick={() => table.refetch()}>Try Again</button>
      </div>
    );
  }

  if (table.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search by name..."
          value={table.search.query}
          onChange={(e) => table.search.set(product.Title.meta.id, e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
        </select>

        <select
          value={selectedSort}
          onChange={(e) => handleSortChange(e.target.value)}
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {/* Results count */}
      <p>{table.totalItems} results found</p>

      {/* Product grid */}
      {table.rows.length === 0 ? (
        <div>
          <p>No products found</p>
          <button
            onClick={() => {
              table.search.clear();
              table.filter.clearAllConditions();
              setSelectedCategory("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {table.rows.map((row) => (
            <div key={row._id} className="product-card">
              <h3>{row.Title}</h3>
              <p>${row.Price}</p>
              <p>{row.Category}</p>
              <p>{row.Stock > 0 ? "In Stock" : "Out of Stock"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
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
