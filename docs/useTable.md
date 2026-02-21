# Table SDK API

React hook for tables, lists, and galleries with sorting, filtering, search, and pagination.

## Imports

```typescript
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type { UseTableOptionsType, UseTableReturnType, ColumnDefinitionType, PaginationStateType } from "@ram_28/kf-ai-sdk/table/types";
import { ConditionOperator, GroupOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
```

---

## Common Mistakes (READ FIRST)

### 1. Missing `as keyof FieldType` cast on column fieldId (TS2322)

`ColumnDefinitionType<T>.fieldId` is typed as `keyof T`, but `bdo.field.id` returns `string`. MUST cast.

```typescript
// ❌ WRONG — string not assignable to keyof (TS2322)
const columns: ColumnDefinitionType<AdminProductFieldType>[] = [
  { fieldId: bdo.product_name.id, label: "Product" },
];

// ✅ CORRECT — cast each fieldId
const columns: ColumnDefinitionType<AdminProductFieldType>[] = [
  { fieldId: bdo.product_name.id as keyof AdminProductFieldType, label: "Product" },
  { fieldId: bdo.unit_price.id as keyof AdminProductFieldType, label: "Price" },
  { fieldId: bdo.status.id as keyof AdminProductFieldType, label: "Status" },
];
```

### 2. Passing `bdo` instead of `source`

`useTable` takes `source` (a BO_ID string), NOT `bdo` (a BDO instance).

```typescript
// ❌ WRONG
useTable({ bdo: product, columns });

// ✅ CORRECT
useTable({ source: product.meta._id, columns });
```

### 3. Calling `.get()` on table rows

Table `rows` are **plain objects**, NOT `ItemType`. Access fields directly.

```typescript
// ❌ WRONG — rows are plain objects
table.rows.map(row => row.product_name.get());

// ✅ CORRECT — access directly
table.rows.map(row => row.product_name);
table.rows.map(row => String(row.product_name ?? ""));
```

### 4. Using entity-level FieldType as generic

Entity types exclude `SystemFieldsType` — `row._id` won't work. Use role-specific type.

```typescript
// ❌ WRONG — ProductType excludes _id
import type { ProductType } from "@/bdo/entities/Product";
useTable<ProductType>({ ... });

// ✅ CORRECT — role type includes SystemFieldsType
import type { AdminProductFieldType } from "@/bdo/admin/Product";
useTable<AdminProductFieldType>({ ... });
```

### 5. Wrong initialState property names

```typescript
// ❌ WRONG — react-table naming
initialState: { sorting: [...], pagination: { pageIndex: 0, pageSize: 10 } }

// ✅ CORRECT — use sort (not sorting), pageNo (not pageIndex), 1-indexed
initialState: { sort: [{ [bdo.product_name.id]: "ASC" }], pagination: { pageNo: 1, pageSize: 10 } }
```

### 6. Using `header` instead of `label` in columns

```typescript
// ❌ WRONG
{ fieldId: bdo.product_name.id as keyof T, header: "Product" }

// ✅ CORRECT
{ fieldId: bdo.product_name.id as keyof T, label: "Product" }
```

### 7. Using `useMemo` for filter side effects instead of `useEffect`

```tsx
// ❌ WRONG — side effects in useMemo cause infinite re-render
useMemo(() => { table.filter.clearAllConditions(); table.filter.addCondition({...}); }, [status]);

// ✅ CORRECT — use useEffect
useEffect(() => { table.filter.clearAllConditions(); table.filter.addCondition({...}); }, [status]);
```

### 8. Rendering Reference/Image/File values in table columns

Table rows are plain objects. Reference values are objects `{ _id, _name }` — render `_name`. Image/File values are `FileType | null` / `FileType[]`.

```tsx
// ❌ WRONG — renders [object Object] for reference field
<td>{row.category}</td>

// ❌ WRONG — renders [object Object] for image field
<td>{row.product_image}</td>

// ✅ CORRECT — reference: access _name
<td>{(row.category as any)?._name ?? "—"}</td>

// ✅ CORRECT — file array: show count or names
<td>{Array.isArray(row.attachments) ? `${(row.attachments as any[]).length} files` : "—"}</td>

// ✅ BEST — use transform in column definition
{ fieldId: bdo.category.id as keyof T, label: "Category", transform: (val) => (val as any)?._name ?? "—" }
```

### 9. Displaying images from ImageField in tables/cards/grids (NEVER use src="#")

Use the pre-built `ImageThumbnail` component from `@/components/ui/image-thumbnail`. It handles the server proxy URL, error fallback, and placeholder automatically. NEVER build image URLs manually or use `src="#"`.

```tsx
import { ImageThumbnail } from "@/components/ui/image-thumbnail";

// ❌ WRONG — src="#" shows broken image, NEVER do this
<img src="#" alt="product" />

// ❌ WRONG — FileName is just the filename string, NOT a URL
<img src={(row.product_image as any)?.FileName} />

// ✅ CORRECT — use ImageThumbnail in table cell
<td>
  <ImageThumbnail boId={bdo.meta._id} instanceId={row._id} fieldId={bdo.product_image.id} value={row[bdo.product_image.id]} />
</td>

// ✅ CORRECT — use ImageThumbnail in product card/grid
<ImageThumbnail
  boId={bdo.meta._id}
  instanceId={row._id}
  fieldId={bdo.product_image.id}
  value={row[bdo.product_image.id]}
  imgClassName="w-full h-full object-cover rounded-lg"
  alt={String(row.product_name ?? "")}
/>

// ✅ CORRECT — use ImageThumbnail in detail page (with bdo.get() ItemType)
<ImageThumbnail
  boId={bdo.meta._id}
  instanceId={item._id}
  fieldId={bdo.product_image.id}
  value={item.product_image.get()}
  imgClassName="w-48 h-48 object-cover rounded-xl"
/>

// ✅ CORRECT — use in column transform
{
  fieldId: bdo.product_image.id as keyof T,
  label: "Image",
  transform: (val, row) => (
    <ImageThumbnail boId={bdo.meta._id} instanceId={row._id} fieldId={bdo.product_image.id} value={val} />
  ),
}
```

**Key rules:**
- ALWAYS use `<ImageThumbnail>` for displaying images outside forms — it builds the correct server proxy URL internally
- NEVER hardcode `src="#"` or use `FileName` as a URL
- For forms (upload/edit), use `<ImageUpload>` instead

### 10. Displaying files from FileField in tables/cards/grids

Use the pre-built `FilePreview` component from `@/components/ui/file-preview`. It shows file names with download links, and inline thumbnails for image files.

```tsx
import { FilePreview } from "@/components/ui/file-preview";

// ❌ WRONG — renders [object Object] or meaningless text
<td>{row.attachments}</td>
<td>{JSON.stringify(row.attachments)}</td>

// ✅ CORRECT — use FilePreview in table cell
<td>
  <FilePreview boId={bdo.meta._id} instanceId={row._id} fieldId={bdo.attachments.id} value={row[bdo.attachments.id]} />
</td>

// ✅ CORRECT — use in column transform
{
  fieldId: bdo.attachments.id as keyof T,
  label: "Files",
  transform: (val, row) => (
    <FilePreview boId={bdo.meta._id} instanceId={row._id} fieldId={bdo.attachments.id} value={val} />
  ),
}
```

**Key rules:**
- ALWAYS use `<FilePreview>` for displaying files outside forms
- For forms (upload/edit), use `<FileUpload>` instead

---

## Complete Table Example

```tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import type { ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";
import { ConditionOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
import { AdminProduct } from "@/bdo/admin/Product";
import type { AdminProductFieldType } from "@/bdo/admin/Product";
import { toast } from "sonner";

export default function ProductList() {
  const navigate = useNavigate();
  const bdo = useMemo(() => new AdminProduct(), []);

  // Columns — MUST cast fieldId as keyof FieldType
  const columns: ColumnDefinitionType<AdminProductFieldType>[] = [
    { fieldId: bdo.product_name.id as keyof AdminProductFieldType, label: bdo.product_name.label, enableSorting: true },
    { fieldId: bdo.unit_price.id as keyof AdminProductFieldType, label: bdo.unit_price.label, enableSorting: true },
    { fieldId: bdo.status.id as keyof AdminProductFieldType, label: bdo.status.label },
    { fieldId: bdo.category.id as keyof AdminProductFieldType, label: bdo.category.label,
      transform: (val) => (val as any)?._name ?? "—" },
  ];

  const table = useTable<AdminProductFieldType>({
    source: bdo.meta._id,
    columns,
    initialState: {
      sort: [{ [bdo.product_name.id]: "ASC" }],
      pagination: { pageNo: 1, pageSize: 10 },
    },
  });

  // Status filter — useEffect for side effects, NOT useMemo
  const [statusFilter, setStatusFilter] = useState("all");
  useEffect(() => {
    table.filter.clearAllConditions();
    if (statusFilter !== "all") {
      table.filter.addCondition({
        Operator: ConditionOperator.EQ,
        LHSField: bdo.status.id,
        RHSValue: statusFilter,
        RHSType: FilterValueSource.Constant,
      });
    }
  }, [statusFilter]);

  if (table.isLoading) return <div>Loading...</div>;
  if (table.error) return <div>Error: {table.error.message}</div>;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
      await bdo.delete(id);
      toast.success("Deleted");
      table.refetch();
    } catch (e) { toast.error("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search..."
        value={table.search.query}
        onChange={(e) => table.search.set(bdo.product_name.id as keyof AdminProductFieldType, e.target.value)}
      />

      {/* Status filter dropdown */}
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="Active">Active</option>
        <option value="Discontinued">Discontinued</option>
      </select>

      {/* Table */}
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.fieldId)} onClick={() => col.enableSorting && table.sort.toggle(col.fieldId)}>
                {col.label}
                {table.sort.field === col.fieldId && (table.sort.direction === "ASC" ? " ↑" : " ↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id} onClick={() => navigate(`/products/${row._id}`)}>
              <td>{String(row.product_name ?? "")}</td>
              <td>${Number(row.unit_price ?? 0).toFixed(2)}</td>
              <td>{String(row.status ?? "")}</td>
              <td>{(row.category as any)?._name ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center gap-4">
        <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>Previous</button>
        <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
        <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>Next</button>
        <span>{table.pagination.totalItems} total</span>
      </div>
    </div>
  );
}
```

---

## Type Definitions

### ColumnDefinitionType

```typescript
interface ColumnDefinitionType<T> {
  fieldId: keyof T;              // MUST cast: bdo.field.id as keyof T
  label?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  transform?: (value: any, row: T) => React.ReactNode;  // Custom rendering
}
```

### UseTableReturnType

```typescript
interface UseTableReturnType<T> {
  rows: T[];                     // Plain objects — access row.field directly (NOT .get())
  totalItems: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  search: { query: string; field: keyof T | null; set: (field: keyof T, query: string) => void; clear: () => void; };
  sort: { field: keyof T | null; direction: "ASC" | "DESC" | null; toggle: (field: keyof T) => void; set: (field: keyof T, dir: "ASC" | "DESC") => void; clear: () => void; };
  filter: UseFilterReturnType<T>;  // Full useFilter API
  pagination: { pageNo: number; pageSize: number; totalPages: number; totalItems: number; canGoNext: boolean; canGoPrevious: boolean; goToNext: () => void; goToPrevious: () => void; goToPage: (n: number) => void; setPageSize: (n: number) => void; };
  refetch: () => Promise<any>;
}
```

### UseTableOptionsType

```typescript
interface UseTableOptionsType<T> {
  source: string;                // bdo.meta._id (NOT the bdo instance)
  columns: ColumnDefinitionType<T>[];
  initialState?: {
    sort?: Record<string, "ASC" | "DESC">[];
    pagination?: { pageNo: number; pageSize: number; };
    filter?: UseFilterOptionsType<T>;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}
```
