# Create Product

> Create a new product using `useBDOForm` with validation, select fields, and submit handling.

```tsx
import { useMemo } from "react";
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import type { UseBDOFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import { BuyerProduct } from "@/bdo/buyer/Product";
import type { BuyerProductEntityType } from "@/bdo/buyer/Product";
import type { FieldErrors } from "react-hook-form";

export default function CreateProductForm() {
  const product = useMemo(() => new BuyerProduct(), []);

  const { register, handleSubmit, errors, isLoading, isSubmitting, watch, setValue }: UseBDOFormReturnType<BuyerProduct> =
    useBDOForm({ bdo: product, defaultValues: { Title: "", Price: 0 } });

  if (isLoading) return <p>Loading...</p>;

  const onSuccess = (data: { _id: string }) => console.log("Created:", data._id);
  const onError = (err: FieldErrors<BuyerProductEntityType> | Error) => {
    if (err instanceof Error) console.error(err.message);
  };

  return (
    <form onSubmit={handleSubmit(onSuccess, onError)}>
      {/* Text input with register() */}
      <label>{product.Title.label} {product.Title.required && <span>*</span>}</label>
      <input {...register(product.Title.id)} />
      {errors.Title && <p>{errors.Title.message}</p>}

      <label>{product.Description.label}</label>
      <textarea {...register(product.Description.id)} rows={3} />
      {errors.Description && <p>{errors.Description.message}</p>}

      {/* Number input with register() */}
      <label>{product.Price.label} {product.Price.required && <span>*</span>}</label>
      <input type="number" step="0.01" {...register(product.Price.id)} />
      {errors.Price && <p>{errors.Price.message}</p>}

      {/* Select field — watch/setValue, not register */}
      <label>{product.Category.label} {product.Category.required && <span>*</span>}</label>
      <select
        value={watch(product.Category.id) ?? ""}
        onChange={(e) => setValue(product.Category.id, e.target.value)}
      >
        <option value="">Select category</option>
        {product.Category.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {errors.Category && <p>{errors.Category.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Add Product"}
      </button>
    </form>
  );
}
```

## Key Patterns

- **Create mode** -- no `recordId` passed to `useBDOForm`; a draft is allocated on mount
- **`register()`** -- for text and number inputs that fire native change events
- **`watch()` + `setValue()`** -- for select fields and other custom components
- **`handleSubmit(onSuccess, onError)`** -- validates, filters to editable fields, calls the API; never call `bdo.create()` manually
- **Validation errors** -- `errors.FieldName.message` shows constraint violations automatically
