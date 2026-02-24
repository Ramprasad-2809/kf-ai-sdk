# Product Listing

> Browse products with search, sortable columns, and pagination using `useBDOTable`.

```tsx
import { useMemo } from "react";
import { useBDOTable } from "@ram_28/kf-ai-sdk/table";
import type { UseBDOTableReturnType } from "@ram_28/kf-ai-sdk/table/types";
import { BuyerProduct } from "@/bdo/buyer/Product";

export default function ProductListingPage() {
  const product = useMemo(() => new BuyerProduct(), []);
  const table: UseBDOTableReturnType<BuyerProduct> = useBDOTable({
    bdo: product,
    initialState: { sort: [{ _created_at: "DESC" }], pagination: { pageNo: 1, pageSize: 10 } },
  });

  if (table.isLoading) return <p>Loading...</p>;
  if (table.error) return <p>Error: {table.error.message}</p>;

  return (
    <div>
      {/* Search */}
      <input
        placeholder="Search by title..."
        value={table.search.query}
        onChange={(e) => table.search.set("Title", e.target.value)}
      />
      {table.search.query && <button onClick={table.search.clear}>Clear</button>}

      {/* Table with sortable headers */}
      <table>
        <thead>
          <tr>
            <th onClick={() => table.sort.toggle("Title")} style={{ cursor: "pointer" }}>
              {product.Title.label}
              {table.sort.field === "Title" && (table.sort.direction === "ASC" ? " ↑" : " ↓")}
            </th>
            <th onClick={() => table.sort.toggle("Price")} style={{ cursor: "pointer" }}>
              {product.Price.label}
              {table.sort.field === "Price" && (table.sort.direction === "ASC" ? " ↑" : " ↓")}
            </th>
            <th>{product.Category.label}</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id}>
              <td>{row.Title.get()}</td>
              <td>${row.Price.get()?.toFixed(2)}</td>
              <td>{row.Category.get()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>Previous</button>
        <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
        <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>Next</button>
      </div>
    </div>
  );
}
```

## Key Patterns

- **`row.Field.get()`** -- rows are `ItemType` proxies; always use `.get()` to read values
- **`search.set(field, query)`** -- updates the input instantly, debounces the API call (300ms)
- **`sort.toggle(field)`** -- cycles ASC → DESC → cleared on each click
- **Pagination** -- `canGoNext`/`canGoPrevious` disable buttons at boundaries; `pageNo`, `totalPages` for display
