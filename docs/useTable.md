# useTable

Complete table state management with data fetching, sorting, filtering, search, and pagination.

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
  // SEARCH (full-text search across all fields)
  // ============================================================

  search: {
    // Current search query string
    query: string;

    // Update search query (300ms debounced internally)
    setQuery: (value: string) => void;

    // Clear search and reset to empty string
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

    // Toggle sort on a field
    // Cycles: none → asc → desc → none
    toggle: (field: keyof T) => void;

    // Clear sorting (return to default order)
    clear: () => void;

    // Set explicit sort field and direction
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
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type { ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function ProductsTable() {
  const product = new Product(Roles.Buyer);

  const columns: ColumnDefinitionType<BuyerProduct>[] = [
    { fieldId: "Title", label: "Name" },
    { fieldId: "Price", label: "Price" },
    { fieldId: "Category", label: "Category" },
  ];

  const table = useTable<BuyerProduct>({
    source: product._id,
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
import { useTable } from "@ram_28/kf-ai-sdk/table";
import { useAuth } from "@ram_28/kf-ai-sdk/auth";
import type {
  UseTableOptionsType,
  UseTableReturnType,
  ColumnDefinitionType,
} from "@ram_28/kf-ai-sdk/table/types";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function MyItemsTable() {
  const product = new Product(Roles.Buyer);
  const { user } = useAuth();

  const columns: ColumnDefinitionType<BuyerProduct>[] = [
    { fieldId: "Title", label: "Name", enableSorting: true },
    { fieldId: "Price", label: "Price", enableSorting: true },
    { fieldId: "Category", label: "Category", enableSorting: true },
    { fieldId: "Stock", label: "Stock", enableSorting: true },
  ];

  const tableOptions: UseTableOptionsType<BuyerProduct> = {
    source: product._id,
    columns,
    initialState: {
      sort: [{ Title: "ASC" }],
      pagination: { pageNo: 1, pageSize: 10 },
      filter: {
        conditions: [
          {
            Operator: "EQ",
            LHSField: "_created_by",
            RHSValue: user._id, // Pass user ID as a string
            RHSType: "Constant",
          },
        ],
        operator: "And",
      },
    },
  };

  const table: UseTableReturnType<BuyerProduct> =
    useTable<BuyerProduct>(tableOptions);

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
function ProductsWithStatusFilter() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    table.filter.clearAllConditions();

    if (status !== "all") {
      table.filter.addCondition({
        Operator: "EQ",
        LHSField: "IsActive",
        RHSValue: status === "active",
        RHSType: "Constant",
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
const PRICE_RANGES = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200, max: null },
] as const;

function ProductsWithMultipleFilters() {
  const product = new Product(Roles.Buyer);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(
    null,
  );

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  // Helper to apply all active filters
  const applyFilters = (category: string, priceRange: string | null) => {
    table.filter.clearAllConditions();

    // Apply category filter
    if (category !== "all") {
      table.filter.addCondition({
        LHSField: "Category",
        Operator: "EQ",
        RHSValue: category,
        RHSType: "Constant",
      });
    }

    // Apply price filter
    if (priceRange) {
      const range = PRICE_RANGES.find((r) => r.label === priceRange);
      if (range) {
        if (range.max === null) {
          // "$200 & Above" - use GTE
          table.filter.addCondition({
            Operator: "GTE",
            LHSField: "Price",
            RHSValue: range.min,
            RHSType: "Constant",
          });
        } else if (range.min === 0) {
          // "Under $25" - use LT
          table.filter.addCondition({
            Operator: "LT",
            LHSField: "Price",
            RHSValue: range.max,
            RHSType: "Constant",
          });
        } else {
          // Range like "$25 to $50" - use Between
          table.filter.addCondition({
            LHSField: "Price",
            Operator: "Between",
            RHSValue: [range.min, range.max],
            RHSType: "Constant",
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
function SortableTable() {
  const product = new Product(Roles.Buyer);

  const columns: ColumnDefinitionType<BuyerProduct>[] = [
    { fieldId: "Title", label: "Name", enableSorting: true },
    { fieldId: "Price", label: "Price", enableSorting: true },
    { fieldId: "Category", label: "Category", enableSorting: true },
  ];

  const table = useTable<BuyerProduct>({
    source: product._id,
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
function TableWithSortDropdown() {
  const product = new Product(Roles.Buyer);
  const [selectedSort, setSelectedSort] = useState("featured");

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
    initialState: {
      sort: [{ Title: "ASC" }],
    },
  });

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    switch (value) {
      case "price-asc":
        table.sort.set("Price", "asc");
        break;
      case "price-desc":
        table.sort.set("Price", "desc");
        break;
      case "newest":
        table.sort.set("_created_at", "desc");
        break;
      case "featured":
      default:
        table.sort.set("Title", "asc");
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
function PaginatedTable() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
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
function TableWithPageSize() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
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
function TableWithPageJump() {
  const product = new Product(Roles.Buyer);
  const [pageInput, setPageInput] = useState("");

  const table = useTable<BuyerProduct>({
    source: product._id,
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

### Basic Search

Add search functionality to filter results by text. The search has built-in debouncing (300ms).

```tsx
function SearchableTable() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
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

---

## Complete Example

A full-featured product listing page with filters, search, sort, and pagination.

```tsx
import { useState } from "react";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type {
  UseTableOptionsType,
  UseTableReturnType,
  ColumnDefinitionType,
} from "@ram_28/kf-ai-sdk/table/types";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function ProductListPage() {
  const product = new Product(Roles.Buyer);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("featured");

  const columns: ColumnDefinitionType<BuyerProduct>[] = [
    { fieldId: "Title", label: "Name", enableSorting: true },
    { fieldId: "Price", label: "Price", enableSorting: true },
    { fieldId: "Category", label: "Category", enableSorting: true },
    { fieldId: "Stock", label: "Stock", enableSorting: true },
  ];

  const tableOptions: UseTableOptionsType<BuyerProduct> = {
    source: product._id,
    columns,
    initialState: {
      sort: [{ Title: "ASC" }],
      pagination: { pageNo: 1, pageSize: 10 },
    },
  };

  const table: UseTableReturnType<BuyerProduct> =
    useTable<BuyerProduct>(tableOptions);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    table.filter.clearAllConditions();
    if (category !== "all") {
      table.filter.addCondition({
        LHSField: "Category",
        Operator: "EQ",
        RHSValue: category,
        RHSType: "Constant",
      });
    }
  };

  const handleSortChange = (value: string) => {
    setSelectedSort(value);
    switch (value) {
      case "price-asc":
        table.sort.set("Price", "asc");
        break;
      case "price-desc":
        table.sort.set("Price", "desc");
        break;
      case "newest":
        table.sort.set("_created_at", "desc");
        break;
      default:
        table.sort.set("Title", "asc");
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
          placeholder="Search..."
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
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

