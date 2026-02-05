# Form SDK API

This Form SDK API proivdes the React-hooks and apis to build Form component when building the Pages.
Here is the example of building Form Component with Form state management with schema validation, computed fields.

You SHOULD only use this API to build Form component

## Imports

```typescript
import {
  useForm,
  parseApiError,
  isNetworkError,
  isValidationError,
  clearFormCache,
} from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormFieldConfigType,
  FieldErrors,
} from "@ram_28/kf-ai-sdk/form/types";
```

## Type Definitions

### UseFormOptionsType

```typescript
// Hook options for initializing the form
interface UseFormOptionsType<T> {
  // Business Object ID (required)
  // Example: product._id
  source: string;

  // Form operation mode (required)
  // - "create": Creates new record
  // - "update": Edit existing record, loads record data
  operation: "create" | "update";

  // Record ID - required for update operations (required for operation: update)
  // The form will fetch this record's data on mount
  recordId?: string;

  // Initial form values
  // Merged with schema defaults and (for update) fetched record data
  defaultValues?: Partial<T>;

  // Validation trigger mode (from react-hook-form)
  // - "onBlur" (default): Validate when field loses focus
  // - "onChange": Validate on every keystroke
  // - "onSubmit": Validate only on form submission
  // - "onTouched": Validate on first blur, then on every change
  // - "all": Validate on both blur and change
  // Note: Computation (draft API) always fires on blur regardless of this setting
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";

  // Enable form initialization (default: true)
  // Set to false to defer schema fetching
  enabled?: boolean;

  // Callback when schema loading fails
  // Use for error reporting or retry logic
  onSchemaError?: (error: Error) => void;
}
```

### UseFormReturnType

```typescript
// Hook return type with all form state and methods
interface UseFormReturnType<T> {
  // ============================================================
  // FORM METHODS (from react-hook-form)
  // ============================================================

  // Register a field for validation and form handling
  // Returns props to spread on input elements
  register: (name: keyof T, options?: RegisterOptions) => InputProps;

  // Handle form submission
  // - onSuccess: Called with response data on successful save
  // - onError: Called with FieldErrors (validation) or Error (API)
  handleSubmit: (
    onSuccess?: (data: T) => void,
    onError?: (error: FieldErrors<T> | Error) => void,
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;

  // Watch field values reactively
  // watch("Price") returns current value, re-renders on change
  watch: (name?: keyof T) => any;

  // Set field value programmatically
  // Useful for computed previews, templates, external data
  setValue: (name: keyof T, value: any, options?: SetValueConfig) => void;

  // Reset form to initial/provided values
  reset: (values?: T) => void;

  // ============================================================
  // FORM STATE (flattened - no nested formState object)
  // ============================================================

  // Current validation errors by field name
  errors: FieldErrors<T>;

  // True when all fields pass validation
  isValid: boolean;

  // True when any field has been modified
  isDirty: boolean;

  // True during form submission
  isSubmitting: boolean;

  // True after successful submission
  isSubmitSuccessful: boolean;

  // ============================================================
  // LOADING STATES
  // ============================================================

  // True during initial load
  isLoading: boolean;

  // True during background operations
  isFetching: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  // Error from schema/record loading (not submission errors)
  loadError: Error | null;

  // True when loadError is present
  hasError: boolean;

  // ============================================================
  // SCHEMA INFORMATION
  // ============================================================

  // Raw BDO schema (for advanced use cases)
  schema: BDOSchemaType | null;

  // Processed schema with field configs ready for rendering
  schemaConfig: FormSchemaConfigType | null;

  // List of computed field names
  computedFields: Array<keyof T>;

  // List of required field names
  requiredFields: Array<keyof T>;

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  // Get configuration for a specific field
  // Returns null if field doesn't exist
  getField: (fieldName: keyof T) => FormFieldConfigType | null;

  // Get all field configurations as a record
  getFields: () => Record<keyof T, FormFieldConfigType>;

  // Check if a field exists in the schema
  hasField: (fieldName: keyof T) => boolean;

  // Check if a field is required
  isFieldRequired: (fieldName: keyof T) => boolean;

  // Check if a field is computed (read-only, server-calculated)
  isFieldComputed: (fieldName: keyof T) => boolean;

  // ============================================================
  // OPERATIONS
  // ============================================================

  // Refresh schema from server (clears cache)
  refreshSchema: () => Promise<void>;

  // Clear all validation errors
  clearErrors: () => void;
}
```

### FormFieldConfigType

```typescript
// Field configuration from processed schema
interface FormFieldConfigType {
  // Field identifier (matches BDO field name)
  name: string;

  // Input type for rendering
  // "text" | "number" | "email" | "date" | "datetime-local"
  // "checkbox" | "select" | "textarea" | "reference"
  type: FormFieldTypeType;

  // Display label (from schema or derived from name)
  label: string;

  // Whether field is required for submission
  required: boolean;

  // Whether field is computed (read-only, server-calculated)
  computed: boolean;

  // Default value from schema
  defaultValue?: any;

  // Options for select/reference fields
  // { value: any, label: string }[]
  options?: SelectOptionType[];

  // Field description for help text
  description?: string;

  // User permissions for this field
  permission: {
    editable: boolean; // Can user edit this field
    readable: boolean; // Can user see this field
    hidden: boolean; // Should field be completely hidden
  };
}
```

## Basic Example

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function CreateProductForm() {
  const product = new Product(Roles.Buyer);

  const form = useForm<BuyerProduct>({
    source: product._id,
    operation: "create",
    defaultValues: {
      Title: "",
      Price: 0,
      Category: "",
    },
  });

  if (form.isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={form.handleSubmit((data) => console.log("Created:", data))}>
      <div>
        <label>Title</label>
        <input {...form.register("Title")} />
        {form.errors.Title && <span>{form.errors.Title.message}</span>}
      </div>

      <div>
        <label>Price</label>
        <input type="number" {...form.register("Price")} />
      </div>

      <div>
        <label>Category</label>
        <input {...form.register("Category")} />
      </div>

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

## Examples

### Product Listing Form

Create form with validation and success handling.

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";
import type { FieldErrors } from "@ram_28/kf-ai-sdk/form/types";
import { useNavigate } from "react-router-dom";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function ProductListingForm() {
  const product = new Product(Roles.Buyer);
  const navigate = useNavigate();

  const form = useForm<BuyerProduct>({
    source: product._id,
    operation: "create",
    defaultValues: {
      Title: "",
      Description: "",
      Price: 0,
      Category: "Electronics",
      Stock: 0,
    },
    mode: "onBlur",
  });

  const onSuccess = (data: BuyerProduct) => {
    toast.success(`Product "${data.Title}" created!`);
    navigate(`/products/${data._id}`);
  };

  const onError = (error: FieldErrors<BuyerProduct> | Error) => {
    if (error instanceof Error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      toast.error("Please fix the validation errors");
    }
  };

  if (form.isLoading) return <div>Loading form...</div>;

  return (
    <form onSubmit={form.handleSubmit(onSuccess, onError)}>
      <div>
        <label>Title {form.isFieldRequired("Title") && "*"}</label>
        <input {...form.register("Title")} />
        {form.errors.Title && (
          <span className="error">{form.errors.Title.message}</span>
        )}
      </div>

      <div>
        <label>Description</label>
        <textarea {...form.register("Description")} rows={4} />
      </div>

      <div>
        <label>Price *</label>
        <input type="number" step="0.01" {...form.register("Price")} />
        {form.errors.Price && (
          <span className="error">{form.errors.Price.message}</span>
        )}
      </div>

      <div>
        <label>Stock</label>
        <input type="number" {...form.register("Stock")} />
      </div>

      <button type="submit" disabled={form.isSubmitting || !form.isValid}>
        {form.isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

### Edit Product

Update mode with record loading state.

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function EditProductForm({ productId }: { productId: string }) {
  const product = new Product(Roles.Buyer);

  const form = useForm<BuyerProduct>({
    source: product._id,
    operation: "update",
    recordId: productId,
  });

  if (form.isLoading) {
    return <div>Loading product...</div>;
  }

  if (form.hasError) {
    return (
      <div>
        <p>Failed to load product: {form.loadError?.message}</p>
        <button onClick={() => form.refreshSchema()}>Retry</button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(() => toast.success("Product updated!"))}>
      <div>
        <label>Title</label>
        <input {...form.register("Title")} />
      </div>

      <div>
        <label>Price</label>
        <input type="number" {...form.register("Price")} />
      </div>

      <div>
        <label>Stock</label>
        <input type="number" {...form.register("Stock")} />
      </div>

      <button type="submit" disabled={!form.isDirty || form.isSubmitting}>
        {form.isSubmitting ? "Saving..." : "Save Changes"}
      </button>

      <button
        type="button"
        onClick={() => form.reset()}
        disabled={!form.isDirty}
      >
        Discard Changes
      </button>
    </form>
  );
}
```

### Auto-Calculate Discount

Working with computed fields and the watch function.

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function PricingForm() {
  const product = new Product(Roles.Buyer);

  const form = useForm<BuyerProduct>({
    source: product._id,
    operation: "create",
    defaultValues: {
      MRP: 0,
      Price: 0,
    },
  });

  // Watch computed field value from server
  const discount = form.watch("Discount");

  if (form.isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={form.handleSubmit()}>
      <div>
        <label>MRP (Maximum Retail Price)</label>
        <input type="number" {...form.register("MRP")} />
      </div>

      <div>
        <label>Selling Price</label>
        <input type="number" {...form.register("Price")} />
      </div>

      {/* Computed field - read-only, server-calculated */}
      {form.isFieldComputed("Discount") && (
        <div>
          <label>Discount % (auto-calculated)</label>
          <input type="number" value={discount ?? 0} readOnly disabled />
        </div>
      )}

      <button type="submit">Save Product</button>
    </form>
  );
}
```

### Static Dropdown

Static fields return options with `Value` and `Label`.

```tsx
import { useState } from "react";
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

function ProductCategoryForm({ recordId }: { recordId: string }) {
  const product = new Product(Roles.Buyer);
  const [categoryOptions, setCategoryOptions] = useState<
    { Value: string; Label: string }[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<BuyerProduct>({
    source: product._id,
    operation: "update",
    recordId,
  });

  // Fetch options only when dropdown is opened
  const handleDropdownOpen = async () => {
    if (categoryOptions.length > 0) {
      setIsOpen(true);
      return; // Already loaded
    }

    setLoadingOptions(true);
    setIsOpen(true);

    try {
      const options = await product.fetchField(recordId, "Category");
      setCategoryOptions(options);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOptions(false);
    }
  };

  if (form.isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={form.handleSubmit()}>
      <div>
        <label>Category</label>
        <select {...form.register("Category")} onFocus={handleDropdownOpen}>
          <option value="">Select category</option>
          {loadingOptions ? (
            <option disabled>Loading...</option>
          ) : (
            categoryOptions.map((opt) => (
              <option key={opt.Value} value={opt.Value}>
                {opt.Label}
              </option>
            ))
          )}
        </select>
      </div>

      <button type="submit">Save</button>
    </form>
  );
}
```

### Dynamic Reference Dropdown

Reference fields return the full object structure. Use a custom dropdown to display rich cards.

```tsx
import { useState } from "react";
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

type SupplierOption = {
  _id: string;
  SupplierName: string;
  Rating: number;
};

function ProductSupplierForm({ recordId }: { recordId: string }) {
  const product = new Product(Roles.Buyer);
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const form = useForm<BuyerProduct>({
    source: product._id,
    operation: "update",
    recordId,
  });

  // Fetch options only when dropdown is clicked
  const handleDropdownClick = async () => {
    setIsOpen(!isOpen);

    if (supplierOptions.length > 0 || loadingOptions) return;

    setLoadingOptions(true);
    try {
      const options = await product.fetchField(recordId, "SupplierInfo");
      setSupplierOptions(options);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleSelect = (supplier: SupplierOption) => {
    setSelectedSupplier(supplier);
    form.setValue("SupplierInfo", {
      _id: supplier._id,
      SupplierName: supplier.SupplierName,
    });
    setIsOpen(false);
  };

  if (form.isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={form.handleSubmit()}>
      <div className="dropdown">
        <label>Supplier</label>

        {/* Selected value display */}
        <button type="button" onClick={handleDropdownClick}>
          {selectedSupplier ? selectedSupplier.SupplierName : "Select supplier"}
        </button>

        {/* Dropdown options with cards */}
        {isOpen && (
          <div className="dropdown-menu">
            {loadingOptions ? (
              <div className="dropdown-item">Loading...</div>
            ) : (
              supplierOptions.map((supplier) => (
                <div
                  key={supplier._id}
                  className="dropdown-card"
                  onClick={() => handleSelect(supplier)}
                >
                  <span className="supplier-name">{supplier.SupplierName}</span>
                  <span className="supplier-rating">
                    {"★".repeat(supplier.Rating)}
                    {"☆".repeat(5 - supplier.Rating)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <button type="submit">Save</button>
    </form>
  );
}
```

## Error Utilities

```typescript
import {
  parseApiError,
  isNetworkError,
  isValidationError,
  clearFormCache,
} from "@ram_28/kf-ai-sdk/form";
```

### parseApiError

Extract user-friendly message from any error type.

```typescript
const onError = (error: Error) => {
  const message = parseApiError(error);
  toast.error(message);
};
```

### isNetworkError

Check if error is network-related (connection, timeout).

```typescript
if (isNetworkError(error)) {
  toast.error("Network error. Please check your connection.");
}
```

### isValidationError

Check if error is a server-side validation error.

```typescript
if (isValidationError(error)) {
  toast.error("Validation failed. Please check your input.");
}
```

### clearFormCache

Clear the schema cache (30-minute TTL by default).

```typescript
// Clear cache and reload to get fresh schema
clearFormCache();
window.location.reload();
```
