# Supplier Dropdown

> Lazy-load ReferenceField options when the dropdown opens using `useQuery`.

```tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import type { UseBDOFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import { BuyerProduct } from "@/bdo/buyer/Product";
import type { ProductSupplierRefType } from "@/bdo/buyer/Product";

export default function SupplierDropdown({ recordId }: { recordId?: string }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const product = useMemo(() => new BuyerProduct(), []);

  const { watch, setValue, item }: UseBDOFormReturnType<BuyerProduct> = useBDOForm({ bdo: product, recordId });

  // Lazy-load options only when dropdown opens and item has an _id
  const { data: suppliers = [], isFetching } = useQuery<ProductSupplierRefType[]>({
    queryKey: ["supplier-options", item._id],
    queryFn: () => product.SupplierInfo.fetchOptions(item._id!),
    enabled: dropdownOpen && !!item._id,
    staleTime: Infinity,
  });

  const currentSupplier = watch(product.SupplierInfo.id);

  return (
    <div>
      <label>{product.SupplierInfo.label}</label>
      <select
        value={currentSupplier?._id ?? ""}
        onFocus={() => setDropdownOpen(true)}
        onChange={(e) => {
          const supplier = suppliers.find((s) => s._id === e.target.value);
          if (supplier) setValue(product.SupplierInfo.id, supplier);
        }}
      >
        <option value="">{currentSupplier?.SupplierName ?? "Select supplier"}</option>
        {isFetching ? (
          <option disabled>Loading...</option>
        ) : (
          suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.SupplierName}</option>
          ))
        )}
      </select>
    </div>
  );
}
```

## Key Patterns

- **`enabled: dropdownOpen && !!item._id`** -- options aren't fetched until the dropdown opens and the draft/record has an ID
- **`fetchOptions(instanceId)`** -- loads reference options for the current record context
- **`watch()` + `setValue()`** -- reads/writes the entire reference object (`{ _id, SupplierName }`)
- **`referenceFields`** -- `product.SupplierInfo.referenceFields` lists the fields fetched from the referenced BDO
- **`staleTime: Infinity`** -- options are cached and not refetched on re-focus
