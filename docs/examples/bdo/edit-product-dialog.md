# Edit Product Dialog

> Click a table row to open an edit form in a dialog, save, and refetch the table.

```tsx
import { useState, useMemo } from "react";
import { useBDOTable } from "@ram_28/kf-ai-sdk/table";
import type { UseBDOTableReturnType } from "@ram_28/kf-ai-sdk/table/types";
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import type { UseBDOFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import { BuyerProduct } from "@/bdo/buyer/Product";
import type { BuyerProductEntityType } from "@/bdo/buyer/Product";
import type { FieldErrors } from "react-hook-form";

export default function ProductPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const product = useMemo(() => new BuyerProduct(), []);

  // ── Table ────────────────────────────────────────────────────
  const table: UseBDOTableReturnType<BuyerProduct> = useBDOTable({
    bdo: product,
    initialState: { sort: [{ Title: "ASC" }], pagination: { pageNo: 1, pageSize: 10 } },
  });

  // ── Form (create when selectedId is null, edit when string) ──
  const { register, handleSubmit, errors, isLoading: formLoading, isSubmitting, watch, setValue, isDirty }: UseBDOFormReturnType<BuyerProduct> =
    useBDOForm({ bdo: product, recordId: selectedId ?? undefined });

  const handleCreate = () => { setSelectedId(null); setShowForm(true); };
  const handleEdit = (id: string) => { setSelectedId(id); setShowForm(true); };
  const onSuccess = () => { setShowForm(false); setSelectedId(null); table.refetch(); };
  const onError = (err: FieldErrors<BuyerProductEntityType> | Error) => {
    if (err instanceof Error) console.error(err.message);
  };

  if (table.isLoading) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={handleCreate}>Add Product</button>

      <table>
        <thead>
          <tr>
            <th>{product.Title.label}</th>
            <th>{product.Price.label}</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id} onClick={() => handleEdit(row._id)} style={{ cursor: "pointer" }}>
              <td>{row.Title.get()}</td>
              <td>${row.Price.get()?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Dialog form */}
      {showForm && (
        <dialog open>
          <h2>{selectedId ? "Edit Product" : "Add Product"}</h2>
          {formLoading ? (
            <p>Loading form...</p>
          ) : (
            <form onSubmit={handleSubmit(onSuccess, onError)}>
              <label>{product.Title.label}</label>
              <input {...register(product.Title.id)} />
              {errors.Title && <p>{errors.Title.message}</p>}

              <label>{product.Price.label}</label>
              <input type="number" step="0.01" {...register(product.Price.id)} />
              {errors.Price && <p>{errors.Price.message}</p>}

              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" disabled={isSubmitting || (!!selectedId && !isDirty)}>
                {isSubmitting ? "Saving..." : selectedId ? "Save Changes" : "Add Product"}
              </button>
            </form>
          )}
        </dialog>
      )}
    </div>
  );
}
```

## Key Patterns

- **Shared BDO instance** -- `useMemo(() => new BuyerProduct(), [])` is passed to both `useBDOTable` and `useBDOForm`
- **Create vs edit mode** -- `selectedId` is `null` for create (no `recordId`), or a string for edit
- **`table.refetch()` after save** -- called in `onSuccess` to refresh the table data
- **`isDirty` guard** -- disables the submit button in edit mode when no changes have been made
