# useForm

Form state management with automatic schema validation, computed fields, and react-hook-form integration.

## Imports

```typescript
import { useForm } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormFieldConfigType,
  FormOperationType,
} from "@ram_28/kf-ai-sdk/form/types";
```

## Type Definitions

```typescript
// Form operation type
type FormOperationType = "create" | "update";

// Hook options
interface UseFormOptionsType<T> {
  source: string;
  operation: FormOperationType;
  recordId?: string;
  defaultValues?: Partial<T>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  enabled?: boolean;
  userRole?: string;
  onSchemaError?: (error: Error) => void;
}

// Hook return type
interface UseFormReturnType<T> {
  // React Hook Form methods
  register: UseFormRegister<T>;
  handleSubmit: (onSuccess?, onError?) => (e?) => Promise<void>;
  watch: (name?) => any;
  setValue: (name, value) => void;
  reset: (values?) => void;

  // Form state
  errors: FieldErrors<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;

  // Loading states
  isLoadingInitialData: boolean;
  isLoadingRecord: boolean;
  isLoading: boolean;

  // Schema info
  schema: BDOSchemaType | null;
  schemaConfig: FormSchemaConfigType | null;
  computedFields: Array<keyof T>;
  requiredFields: Array<keyof T>;

  // Field helpers
  getField: (fieldName) => FormFieldConfigType | null;
  getFields: () => Record<keyof T, FormFieldConfigType>;
  isFieldRequired: (fieldName) => boolean;
  isFieldComputed: (fieldName) => boolean;
}

// Field configuration
interface FormFieldConfigType {
  name: string;
  type: "text" | "number" | "email" | "date" | "checkbox" | "select" | "textarea";
  label: string;
  required: boolean;
  computed: boolean;
  defaultValue?: any;
  options?: { value: any; label: string }[];
  permission: { editable: boolean; readable: boolean; hidden: boolean };
}
```

## Basic Example

A minimal create form with field registration and submission.

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";

interface Product {
  _id: string;
  Title: string;
  Price: number;
  Category: string;
}

function CreateProductForm() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
    defaultValues: {
      Title: "",
      Price: 0,
      Category: "",
    },
  });

  const onSuccess = (data: Product) => {
    console.log("Product created:", data);
  };

  const onError = (error: Error) => {
    console.error("Failed to create:", error.message);
  };

  if (form.isLoading) return <div>Loading form...</div>;

  return (
    <form onSubmit={form.handleSubmit(onSuccess, onError)}>
      <div>
        <label>Title</label>
        <input {...form.register("Title")} />
        {form.errors.Title && <span>{form.errors.Title.message}</span>}
      </div>

      <div>
        <label>Price</label>
        <input type="number" {...form.register("Price")} />
        {form.errors.Price && <span>{form.errors.Price.message}</span>}
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

---

## Create vs Update

### Create Form

Initialize a form for creating new records.

```tsx
function CreateForm() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
    defaultValues: {
      Title: "",
      Price: 0,
      Stock: 0,
    },
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register("Title")} placeholder="Product title" />
      <input type="number" {...form.register("Price")} placeholder="Price" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Edit Form

Load existing record data for editing.

```tsx
function EditForm({ productId }: { productId: string }) {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "update",
    recordId: productId,
  });

  if (form.isLoadingRecord) return <div>Loading product...</div>;

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register("Title")} />
      <input type="number" {...form.register("Price")} />
      <button type="submit" disabled={!form.isDirty}>
        Save Changes
      </button>
    </form>
  );
}
```

### Toggle Between Create and Edit

Switch form mode based on selection.

```tsx
function ProductForm({ product }: { product?: Product }) {
  const isEditing = !!product;

  const form = useForm<Product>({
    source: "BDO_Products",
    operation: isEditing ? "update" : "create",
    recordId: product?._id,
    defaultValues: product ?? { Title: "", Price: 0 },
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <h2>{isEditing ? "Edit Product" : "New Product"}</h2>
      <input {...form.register("Title")} />
      <input type="number" {...form.register("Price")} />
      <button type="submit">
        {isEditing ? "Update" : "Create"}
      </button>
    </form>
  );
}
```

---

## Field Rendering

### Using getField for Metadata

Access field configuration from the schema.

```tsx
function DynamicField({ form, fieldName }: { form: UseFormReturnType<Product>; fieldName: keyof Product }) {
  const field = form.getField(fieldName);

  if (!field || field.permission.hidden) return null;

  const isDisabled = !field.permission.editable || field.computed;

  return (
    <div className="field">
      <label>
        {field.label}
        {field.required && <span className="required">*</span>}
        {field.computed && <span className="computed">(auto)</span>}
      </label>

      {field.type === "select" && field.options ? (
        <select {...form.register(fieldName)} disabled={isDisabled}>
          <option value="">Select {field.label}</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "number" ? "number" : "text"}
          {...form.register(fieldName)}
          disabled={isDisabled}
        />
      )}

      {form.errors[fieldName] && (
        <span className="error">{form.errors[fieldName]?.message}</span>
      )}
    </div>
  );
}
```

### Handling Computed Fields

Display auto-calculated fields as read-only.

```tsx
function FormWithComputedFields() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <div>
        <label>MRP</label>
        <input type="number" {...form.register("MRP")} />
      </div>

      <div>
        <label>Price</label>
        <input type="number" {...form.register("Price")} />
      </div>

      {/* Discount is computed from MRP and Price */}
      {form.isFieldComputed("Discount") && (
        <div>
          <label>Discount % (auto-calculated)</label>
          <input
            type="number"
            value={form.watch("Discount") ?? 0}
            readOnly
            disabled
          />
        </div>
      )}

      <button type="submit">Save</button>
    </form>
  );
}
```

### Render All Fields Dynamically

Generate form fields from schema configuration.

```tsx
function DynamicForm() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  if (form.isLoading) return <div>Loading...</div>;

  const fields = form.getFields();

  return (
    <form onSubmit={form.handleSubmit()}>
      {Object.entries(fields).map(([fieldName, field]) => {
        if (field.permission.hidden) return null;

        return (
          <div key={fieldName}>
            <label>{field.label}</label>
            <input
              {...form.register(fieldName as keyof Product)}
              type={field.type === "number" ? "number" : "text"}
              disabled={!field.permission.editable || field.computed}
            />
          </div>
        );
      })}

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Validation

### Displaying Field Errors

Show validation errors inline with fields.

```tsx
function FormWithValidation() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
    mode: "onBlur", // Validate on blur
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <div className={form.errors.Title ? "field-error" : ""}>
        <label>Title *</label>
        <input {...form.register("Title")} />
        {form.errors.Title && (
          <span className="error-message">{form.errors.Title.message}</span>
        )}
      </div>

      <div className={form.errors.Price ? "field-error" : ""}>
        <label>Price *</label>
        <input type="number" {...form.register("Price")} />
        {form.errors.Price && (
          <span className="error-message">{form.errors.Price.message}</span>
        )}
      </div>

      <button type="submit" disabled={!form.isValid}>
        Submit
      </button>
    </form>
  );
}
```

### Form State Indicators

Show form status to users.

```tsx
function FormWithStateIndicators() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "update",
    recordId: "PROD-001",
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Form fields */}
      <input {...form.register("Title")} />
      <input type="number" {...form.register("Price")} />

      {/* Status bar */}
      <div className="form-status">
        {form.isDirty && <span className="unsaved">Unsaved changes</span>}
        {!form.isValid && <span className="invalid">Please fix errors</span>}
        {form.isSubmitting && <span className="saving">Saving...</span>}
        {form.isSubmitSuccessful && <span className="success">Saved!</span>}
      </div>

      <button type="submit" disabled={form.isSubmitting || !form.isDirty}>
        Save Changes
      </button>

      <button type="button" onClick={() => form.reset()} disabled={!form.isDirty}>
        Discard Changes
      </button>
    </form>
  );
}
```

---

## Submission

### Handle Submit with Callbacks

Process successful submissions and errors.

```tsx
function FormWithCallbacks() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  const onSuccess = (data: Product) => {
    alert(`Product "${data.Title}" created successfully!`);
    form.reset();
  };

  const onError = (error: FieldErrors<Product> | Error) => {
    if (error instanceof Error) {
      // API error
      alert(`Server error: ${error.message}`);
    } else {
      // Validation errors
      const fieldNames = Object.keys(error).join(", ");
      alert(`Please fix errors in: ${fieldNames}`);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSuccess, onError)}>
      <input {...form.register("Title")} placeholder="Title" />
      <input type="number" {...form.register("Price")} placeholder="Price" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Programmatic Submission

Submit form without a submit button.

```tsx
function FormWithProgrammaticSubmit() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  const handleSaveAndClose = async () => {
    const submitHandler = form.handleSubmit(
      (data) => {
        console.log("Saved:", data);
        // Close modal or navigate away
      },
      (error) => {
        console.error("Validation failed:", error);
      }
    );

    await submitHandler();
  };

  return (
    <div>
      <input {...form.register("Title")} />
      <input type="number" {...form.register("Price")} />

      <div className="actions">
        <button type="button" onClick={() => form.reset()}>
          Cancel
        </button>
        <button type="button" onClick={handleSaveAndClose}>
          Save & Close
        </button>
      </div>
    </div>
  );
}
```

---

## Watch and setValue

### Watch Field Values

React to field value changes in real-time.

```tsx
function FormWithWatcher() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  const mrp = form.watch("MRP");
  const price = form.watch("Price");
  const discount = mrp > 0 ? ((mrp - price) / mrp * 100).toFixed(1) : 0;

  return (
    <form onSubmit={form.handleSubmit()}>
      <div>
        <label>MRP</label>
        <input type="number" {...form.register("MRP")} />
      </div>

      <div>
        <label>Price</label>
        <input type="number" {...form.register("Price")} />
      </div>

      <div className="preview">
        <p>Discount: {discount}%</p>
        <p>You save: ${(mrp - price).toFixed(2)}</p>
      </div>

      <button type="submit">Save</button>
    </form>
  );
}
```

### Set Field Values Programmatically

Update field values from external actions.

```tsx
function FormWithSetValue() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  const applyTemplate = (template: string) => {
    switch (template) {
      case "electronics":
        form.setValue("Category", "Electronics");
        form.setValue("Price", 99.99);
        break;
      case "books":
        form.setValue("Category", "Books");
        form.setValue("Price", 19.99);
        break;
    }
  };

  return (
    <form onSubmit={form.handleSubmit()}>
      <div className="templates">
        <button type="button" onClick={() => applyTemplate("electronics")}>
          Electronics Template
        </button>
        <button type="button" onClick={() => applyTemplate("books")}>
          Books Template
        </button>
      </div>

      <input {...form.register("Title")} placeholder="Title" />
      <input {...form.register("Category")} placeholder="Category" />
      <input type="number" {...form.register("Price")} placeholder="Price" />

      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Error Utilities

The SDK provides utilities to help handle and categorize errors from form operations.

### Available Utilities

```typescript
import {
  parseApiError,
  isNetworkError,
  isValidationError,
  clearFormCache,
} from "@ram_28/kf-ai-sdk/form";
```

| Utility | Description |
|---------|-------------|
| `parseApiError(error)` | Extracts a user-friendly message from any error type |
| `isNetworkError(error)` | Returns `true` if error is network-related (connection, timeout) |
| `isValidationError(error)` | Returns `true` if error is a validation/schema error |
| `clearFormCache()` | Clears the schema cache (30-minute TTL by default) |

### Parse and Handle API Errors

Use built-in utilities for comprehensive error handling.

```tsx
import {
  parseApiError,
  isNetworkError,
  isValidationError,
  clearFormCache,
} from "@ram_28/kf-ai-sdk/form";

function FormWithErrorHandling() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  const onError = (error: Error) => {
    const message = parseApiError(error);

    if (isNetworkError(error)) {
      alert("Network error. Please check your connection.");
    } else if (isValidationError(error)) {
      alert("Validation failed. Please check your input.");
    } else {
      alert(message);
    }
  };

  const handleClearCache = () => {
    clearFormCache();
    window.location.reload();
  };

  return (
    <form onSubmit={form.handleSubmit(undefined, onError)}>
      {/* form fields */}
      <button type="submit">Save</button>
      <button type="button" onClick={handleClearCache}>
        Clear Cache & Reload
      </button>
    </form>
  );
}
```

### Handling Different Error Types

The `handleSubmit` callback receives different error types depending on the failure stage:

```tsx
function FormWithDetailedErrorHandling() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
  });

  const onSubmit = (data: Product) => {
    console.log("Success:", data);
  };

  const onError = (error: FieldErrors<Product> | Error, event?: React.BaseSyntheticEvent) => {
    // Check if it's a validation error (from react-hook-form)
    if (!(error instanceof Error)) {
      // Field validation errors - error is FieldErrors<Product>
      const invalidFields = Object.keys(error);
      console.log("Validation failed for fields:", invalidFields);

      // Access specific field errors
      if (error.Title) {
        console.log("Title error:", error.Title.message);
      }
      return;
    }

    // API/Network error - error is Error
    if (isNetworkError(error)) {
      // Handle offline, timeout, connection refused
      console.error("Network issue:", error.message);
    } else if (isValidationError(error)) {
      // Server-side validation error
      console.error("Server validation:", parseApiError(error));
    } else {
      // Other server errors (500, etc.)
      console.error("Server error:", parseApiError(error));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onError)}>
      {/* form fields */}
    </form>
  );
}
```

### Schema Loading Errors

Handle errors when the form schema fails to load.

```tsx
function FormWithSchemaErrorHandling() {
  const form = useForm<Product>({
    source: "BDO_Products",
    operation: "create",
    onSchemaError: (error) => {
      console.error("Failed to load form schema:", error.message);
      // Optionally clear cache and retry
      clearFormCache();
    },
  });

  // Check for load errors
  if (form.loadError) {
    return (
      <div className="error-state">
        <p>Failed to load form: {form.loadError.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (form.isLoading) {
    return <div>Loading form...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* form fields */}
    </form>
  );
}
```
