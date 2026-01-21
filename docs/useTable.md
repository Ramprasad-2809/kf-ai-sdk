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
import type { SortType } from "@ram_28/kf-ai-sdk/api/types";
import type { FilterStateType } from "@ram_28/kf-ai-sdk/filter/types";
```

## Type Definitions

```typescript
// Column configuration
interface ColumnDefinitionType<T> {
  fieldId: keyof T;
  label?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  transform?: (value: any, row: T) => React.ReactNode;
}

// State types (import from respective modules)
type SortType = Array<Record<string, "ASC" | "DESC">>;  // from @ram_28/kf-ai-sdk/api/types

interface PaginationStateType {  // from @ram_28/kf-ai-sdk/table/types
  pageNo: number;
  pageSize: number;
}

interface FilterStateType<T = any> {  // from @ram_28/kf-ai-sdk/filter/types
  conditions?: Array<ConditionType<T> | ConditionGroupType<T>>;
  operator?: "And" | "Or" | "Not";
}

// Hook options
interface UseTableOptionsType<T> {
  source: string;
  columns: ColumnDefinitionType<T>[];
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;  // Defaults: { pageNo: 1, pageSize: 10 }
    filter?: FilterStateType<T>;  // Generic for type-safe LHSField
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}

// Hook return type
interface UseTableReturnType<T> {
  rows: T[];
  totalItems: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  search: { query: string; setQuery: (value: string) => void; clear: () => void };
  sort: { field: keyof T | null; direction: "asc" | "desc" | null; toggle: (field: keyof T) => void; clear: () => void; set: (field: keyof T, direction: "asc" | "desc") => void };
  filter: UseFilterReturnType<T>;
  pagination: { pageNo: number; pageSize: number; totalPages: number; totalItems: number; canGoNext: boolean; canGoPrevious: boolean; goToNext: () => void; goToPrevious: () => void; goToPage: (page: number) => void; setPageSize: (size: number) => void };
  refetch: () => Promise<ListResponseType<T>>;
}
```

## Basic Example

A minimal table displaying data with loading and error states.

```tsx
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type { ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductType<typeof Roles.Buyer>;

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
import type { UseTableOptionsType, UseTableReturnType, ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductType<typeof Roles.Buyer>;

function ProductsWithInitialState() {
  const product = new Product(Roles.Buyer);

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

  const table: UseTableReturnType<BuyerProduct> = useTable<BuyerProduct>(tableOptions);

  if (table.isLoading) return <div>Loading...</div>;

  return (
    <div>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.fieldId)}
                onClick={() => col.enableSorting && table.sort.toggle(col.fieldId)}
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
        <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>
          Previous
        </button>
        <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
        <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Filter

### Category Filter

Filter table data by a single category value.

```tsx
import { useTable } from "@ram_28/kf-ai-sdk/table";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductType<typeof Roles.Buyer>;

function ProductsWithCategoryFilter() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  const filterByCategory = (category: string) => {
    table.filter.clearAllConditions();
    table.filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: category,
      RHSType: "Constant",
    });
  };

  return (
    <div>
      <div className="filter-buttons">
        <button onClick={() => filterByCategory("Electronics")}>Electronics</button>
        <button onClick={() => filterByCategory("Books")}>Books</button>
        <button onClick={() => filterByCategory("Clothing")}>Clothing</button>
        <button onClick={() => table.filter.clearAllConditions()}>Clear</button>
      </div>
      {/* table rendering */}
    </div>
  );
}
```

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

### My Tasks Filter

Filter to show only items assigned to the current user.

```tsx
function MyTasksFilter({ currentUserId }: { currentUserId: string }) {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  const showMyItems = () => {
    table.filter.clearAllConditions();
    table.filter.addCondition({
      Operator: "EQ",
      LHSField: "_created_by._id",
      RHSValue: currentUserId,
      RHSType: "Constant",
    });
  };

  const showAllItems = () => {
    table.filter.clearAllConditions();
  };

  return (
    <div>
      <button onClick={showMyItems}>My Items</button>
      <button onClick={showAllItems}>All Items</button>
      {/* table rendering */}
    </div>
  );
}
```

### Date Range Filter

Filter records within a date range.

```tsx
function ProductsWithDateFilter() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  const filterByDateRange = (startDate: string, endDate: string) => {
    table.filter.clearAllConditions();
    table.filter.addCondition({
      Operator: "Between",
      LHSField: "_created_at",
      RHSValue: [startDate, endDate],
      RHSType: "Constant",
    });
  };

  const filterLastWeek = () => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    filterByDateRange(start, end);
  };

  const filterLastMonth = () => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    filterByDateRange(start, end);
  };

  return (
    <div>
      <button onClick={filterLastWeek}>Last 7 Days</button>
      <button onClick={filterLastMonth}>Last 30 Days</button>
      <button onClick={() => table.filter.clearAllConditions()}>All Time</button>
      {/* table rendering */}
    </div>
  );
}
```

### Price Range Filter

Filter products by price ranges using different operators.

```tsx
const PRICE_RANGES = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 to $50", min: 25, max: 50 },
  { label: "$50 to $100", min: 50, max: 100 },
  { label: "$100 to $200", min: 100, max: 200 },
  { label: "$200 & Above", min: 200, max: null },
] as const;

function ProductsWithPriceFilter() {
  const product = new Product(Roles.Buyer);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  const handlePriceFilter = (rangeLabel: string | null) => {
    setSelectedRange(rangeLabel);
    table.filter.clearAllConditions();

    if (!rangeLabel) return;

    const range = PRICE_RANGES.find((r) => r.label === rangeLabel);
    if (!range) return;

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
        Operator: "Between",
        LHSField: "Price",
        RHSValue: [range.min, range.max],
        RHSType: "Constant",
      });
    }
  };

  return (
    <div>
      {PRICE_RANGES.map((range) => (
        <label key={range.label}>
          <input
            type="checkbox"
            checked={selectedRange === range.label}
            onChange={() => handlePriceFilter(selectedRange === range.label ? null : range.label)}
          />
          {range.label}
        </label>
      ))}
      {/* table rendering */}
    </div>
  );
}
```

### Multiple Filters Combined

Apply multiple filter conditions together.

```tsx
function ProductsWithMultipleFilters() {
  const product = new Product(Roles.Buyer);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);

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
      if (range && range.max !== null) {
        table.filter.addCondition({
          LHSField: "Price",
          Operator: "Between",
          RHSValue: [range.min, range.max],
          RHSType: "Constant",
        });
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
      <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
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
          <option key={range.label} value={range.label}>{range.label}</option>
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
              onClick={() => col.enableSorting && table.sort.toggle(col.fieldId)}
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
      <select value={selectedSort} onChange={(e) => handleSortChange(e.target.value)}>
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
        <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>
          Previous
        </button>

        <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>

        <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>
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

Add search functionality to filter results by text.

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
      </div>

      {/* table rendering */}
    </div>
  );
}
```

### Search Behavior

The search functionality has **built-in debouncing** (300ms) to prevent excessive API calls while typing. This means:

- `table.search.query` updates immediately (for UI display)
- The actual API query is debounced by 300ms
- Search queries are limited to 255 characters for security

You can use the search input directly without implementing your own debouncing:

```tsx
function SearchableTableWithIndicator() {
  const product = new Product(Roles.Buyer);

  const table = useTable<BuyerProduct>({
    source: product._id,
    columns,
  });

  return (
    <div>
      <input
        type="text"
        placeholder="Search products..."
        value={table.search.query}
        onChange={(e) => table.search.setQuery(e.target.value)}
      />
      {/* isFetching is true during the debounced API call */}
      {table.isFetching && <span>Searching...</span>}

      {/* table rendering */}
    </div>
  );
}
```

> **Note:** The 300ms debounce is applied internally. You don't need to implement your own debouncing logic.

---

## Complete Example

A full-featured product listing page with filters, search, sort, and pagination.

```tsx
import { useState } from "react";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type { UseTableOptionsType, UseTableReturnType, ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductType<typeof Roles.Buyer>;

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

  const table: UseTableReturnType<BuyerProduct> = useTable<BuyerProduct>(tableOptions);

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

        <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
        </select>

        <select value={selectedSort} onChange={(e) => handleSortChange(e.target.value)}>
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
          <button onClick={() => {
            table.search.clear();
            table.filter.clearAllConditions();
            setSelectedCategory("all");
          }}>
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
        <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>
          Previous
        </button>
        <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
        <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>
          Next
        </button>
      </div>
    </div>
  );
}
```
