# useTable

## Brief Description

- Provides complete table state management including data fetching, sorting, filtering, search, and pagination
- Integrates with `useFilter` for advanced filtering capabilities with nested condition groups
- Handles API interactions automatically using React Query for caching and background refetching
- Returns flattened state accessors (`sort.field`, `pagination.currentPage`) for easy component integration

## Type Reference

```typescript
import { useTable, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk";
import type {
  UseTableOptions,
  UseTableReturn,
  ColumnDefinition,
  Condition,
  ConditionGroup,
  ConditionOperator,
  ConditionGroupOperator,
  Filter,
  UseFilterReturn,
  ListResponse,
} from "@ram_28/kf-ai-sdk";

// Condition operators for comparing field values
type ConditionOperator =
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE"
  | "Between" | "NotBetween"
  | "IN" | "NIN"
  | "Empty" | "NotEmpty"
  | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

// Group operators for combining conditions
type ConditionGroupOperator = "And" | "Or" | "Not";

// Column configuration
interface ColumnDefinition<T> {
  fieldId: keyof T;
  label?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  transform?: (value: any, row: T) => React.ReactNode;
}

// Hook options
interface UseTableOptions<T> {
  source: string;
  columns: ColumnDefinition<T>[];
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  initialState?: {
    pagination?: { pageNo: number; pageSize: number };
    sorting?: { field: keyof T; direction: "asc" | "desc" };
    filters?: Array<Condition | ConditionGroup>;
    filterOperator?: ConditionGroupOperator;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}

// Hook return type
interface UseTableReturn<T> {
  // Data
  rows: T[];
  totalItems: number;

  // Loading states
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
    set: (field: keyof T, direction: "asc" | "desc") => void;
  };

  // Filter (uses useFilter internally)
  filter: UseFilterReturn;

  // Pagination
  pagination: {
    currentPage: number;
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

// API response structure
interface ListResponse<T> {
  Data: T[];
}
```

## Usage Example

```tsx
import { useTable, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk";
import type {
  UseTableOptions,
  UseTableReturn,
  ColumnDefinition,
  Condition,
  ConditionGroup,
  ConditionOperator,
  ConditionGroupOperator,
  Filter,
  UseFilterReturn,
  ListResponse,
} from "@ram_28/kf-ai-sdk";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

// Get the typed product for the Buyer role
type BuyerProduct = ProductType<typeof Roles.Buyer>;

function ProductsPage() {
  // Instantiate the Product source with role
  const product = new Product(Roles.Buyer);

  // Column definitions with type safety
  const columns: ColumnDefinition<BuyerProduct>[] = [
    { fieldId: "Title", label: "Name", enableSorting: true },
    {
      fieldId: "Price",
      label: "Price",
      enableSorting: true,
      transform: (value) => `$${value.toFixed(2)}`,
    },
    { fieldId: "Category", label: "Category", enableSorting: true, enableFiltering: true },
    { fieldId: "Stock", label: "Stock", enableSorting: true },
  ];

  // Hook configuration with full options
  const options: UseTableOptions<BuyerProduct> = {
    source: product._id, // Use the Business Object ID from the Product class
    columns,
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
      sorting: { field: "_created_at", direction: "desc" },
      filterOperator: "And",
    },
    onError: (error: Error) => console.error("Table error:", error.message),
    onSuccess: (data: BuyerProduct[]) => console.log("Loaded", data.length, "products"),
  };

  const table: UseTableReturn<BuyerProduct> = useTable<BuyerProduct>(options);

  // Access filter functionality (UseFilterReturn)
  const filterState: UseFilterReturn = table.filter;

  // Add a filter with dynamic operator selection
  const addFilter = (field: keyof BuyerProduct, operator: ConditionOperator, value: any) => {
    table.filter.add({
      Operator: operator,
      LHSField: field as string,
      RHSValue: value,
    });
  };

  // Add a simple filter condition
  const filterByCategory = (category: string) => {
    table.filter.clear();
    addFilter("Category", "EQ", category);
  };

  // Add a complex nested filter (Price > 100 OR Stock < 10)
  const addComplexFilter = () => {
    const groupId = table.filter.addGroup("Or");
    table.filter.addTo(groupId, { Operator: "GT", LHSField: "Price", RHSValue: 100 });
    table.filter.addTo(groupId, { Operator: "LT", LHSField: "Stock", RHSValue: 10 });
  };

  // Display active filters using type guards
  const renderActiveFilters = () => (
    <div className="active-filters">
      {table.filter.items.map((item) => {
        if (isCondition(item)) {
          return (
            <span key={item.id} className="filter-tag">
              {item.LHSField} {item.Operator} {String(item.RHSValue)}
              <button onClick={() => table.filter.remove(item.id!)}>×</button>
            </span>
          );
        }
        if (isConditionGroup(item)) {
          return (
            <span key={item.id} className="filter-group-tag">
              {item.Operator} Group ({item.Condition.length} conditions)
              <button onClick={() => table.filter.remove(item.id!)}>×</button>
            </span>
          );
        }
        return null;
      })}
    </div>
  );

  // Toggle filter logic operator
  const toggleFilterLogic = () => {
    const next: ConditionGroupOperator = table.filter.operator === "And" ? "Or" : "And";
    table.filter.setOperator(next);
  };

  // Refetch data manually
  const handleRefresh = async () => {
    const response: ListResponse<BuyerProduct> = await table.refetch();
    console.log(`Refreshed: ${response.Data.length} items`);
  };

  // Access filter payload for debugging
  const getFilterPayload = (): Filter | undefined => {
    return table.filter.payload;
  };

  if (table.isLoading) {
    return <div>Loading products...</div>;
  }

  if (table.error) {
    return <div>Error: {table.error.message}</div>;
  }

  return (
    <div className="products-page">
      {/* Search */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={table.search.query}
          onChange={(e) => table.search.setQuery(e.target.value)}
        />
        <button onClick={table.search.clear}>Clear</button>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <button onClick={() => filterByCategory("Electronics")}>Electronics</button>
        <button onClick={() => filterByCategory("Books")}>Books</button>
        <button onClick={addComplexFilter}>Add Complex Filter</button>
        <button onClick={toggleFilterLogic}>
          Logic: {table.filter.operator}
        </button>
        {table.filter.hasConditions && (
          <button onClick={() => table.filter.clear()}>Clear All Filters</button>
        )}
      </div>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Table */}
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.fieldId)}
                onClick={() => col.enableSorting && table.sort.toggle(col.fieldId)}
                style={{ cursor: col.enableSorting ? "pointer" : "default" }}
              >
                {col.label || String(col.fieldId)}
                {table.sort.field === col.fieldId && (
                  <span>{table.sort.direction === "asc" ? " ↑" : " ↓"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: BuyerProduct) => (
            <tr key={row._id}>
              <td>{row.Title}</td>
              <td>${row.Price.toFixed(2)}</td>
              <td>{row.Category}</td>
              <td>{row.Stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={table.pagination.goToPrevious}
          disabled={!table.pagination.canGoPrevious}
        >
          Previous
        </button>
        <span>
          Page {table.pagination.currentPage} of {table.pagination.totalPages}
          ({table.pagination.totalItems} total)
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
        <input
          type="number"
          min={1}
          max={table.pagination.totalPages}
          placeholder="Go to page"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              table.pagination.goToPage(Number((e.target as HTMLInputElement).value));
            }
          }}
        />
      </div>

      {/* Actions */}
      <div className="table-actions">
        <button onClick={handleRefresh} disabled={table.isFetching}>
          {table.isFetching ? "Refreshing..." : "Refresh"}
        </button>
        <button onClick={() => table.sort.clear()}>Clear Sort</button>
        <button onClick={() => table.sort.set("Price", "desc")}>Sort by Price (desc)</button>
      </div>

      {/* Debug: Filter payload */}
      <details>
        <summary>Filter Payload (Debug)</summary>
        <pre>{JSON.stringify(getFilterPayload(), null, 2)}</pre>
      </details>
    </div>
  );
}
```
