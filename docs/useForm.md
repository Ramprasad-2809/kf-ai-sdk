# useForm Hook Documentation

The `useForm` hook integrates React Hook Form with backend-driven schemas, validation, and computed fields.

## Table of Contents

- [Type Reference](#type-reference)
- [Usage Example](#usage-example)
- [API Quick Reference](#api-quick-reference)

## Type Reference

### Import Types

```typescript
import { useForm } from "@ram_28/kf-ai-sdk";
import type {
  UseFormOptions,
  UseFormReturn,
  FormOperation,
  ProcessedField,
  ProcessedSchema,
  BackendFieldDefinition,
  BackendSchema,
  RuleExecutionContext,
} from "@ram_28/kf-ai-sdk";
```

### FormOperation

```typescript
type FormOperation = "create" | "update";
```

### ProcessedField

Processed field with validation rules and metadata.

```typescript
interface ProcessedField {
  id: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'currency' | 'email' | 'select';
  required: boolean;
  computed: boolean;
  readOnly: boolean;
  hidden: boolean;
  defaultValue?: any;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: Array<{ label: string; value: any }>;
  computationExpression?: string;
  dependsOn?: string[];
}
```

### ProcessedSchema

```typescript
interface ProcessedSchema {
  fields: Record<string, ProcessedField>;
  requiredFields: string[];
  computedFields: string[];
  fieldOrder: string[];
}
```

### BackendFieldDefinition

Raw field definition from backend.

```typescript
interface BackendFieldDefinition {
  name: string;
  dataType: string;
  displayName?: string;
  isMandatory?: boolean;
  isComputed?: boolean;
  defaultValue?: any;
  validations?: BackendValidation[];
  computations?: BackendComputation[];
  options?: Array<{ label: string; value: any }>;
}
```

### BackendSchema

```typescript
interface BackendSchema {
  name: string;
  fields: BackendFieldDefinition[];
}
```

### RuleExecutionContext<T>

Context for computation rule callbacks.

```typescript
interface RuleExecutionContext<T> {
  values: T;
  triggerField: keyof T;
  previousValues: T;
  schema: ProcessedSchema;
  getValue: <K extends keyof T>(field: K) => T[K];
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
}
```

### UseFormOptions<T>

```typescript
interface UseFormOptions<T> {
  source: string;
  operation: FormOperation;
  recordId?: string;
  defaultValues?: Partial<T>;
  mode?: "onBlur" | "onChange" | "onSubmit";
  enabled?: boolean;
  schema?: BackendSchema;
  onComputationRule?: (context: RuleExecutionContext<T>) => Promise<Partial<T>>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSchemaError?: (error: Error) => void;
  onSubmitError?: (error: Error) => void;
}
```

### UseFormReturn<T>

```typescript
interface UseFormReturn<T> {
  // React Hook Form methods
  register: UseFormRegister<T>;
  handleSubmit: () => (e?: React.FormEvent) => Promise<void>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  reset: UseFormReset<T>;
  getValues: () => T;
  trigger: (name?: keyof T | (keyof T)[]) => Promise<boolean>;

  // Flattened state (recommended)
  errors: FieldErrors<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;

  // Legacy (backward compatible)
  formState: FormState<T>;

  // Loading states
  isLoadingInitialData: boolean;
  isLoadingRecord: boolean;
  isLoading: boolean;

  // Error handling
  loadError: Error | null;
  submitError: Error | null;

  // Schema info
  schema: BackendSchema | null;
  processedSchema: ProcessedSchema | null;
  computedFields: Array<keyof T>;
  requiredFields: Array<keyof T>;

  // Field helpers
  getField: <K extends keyof T>(fieldName: K) => ProcessedField | null;
  isFieldRequired: <K extends keyof T>(fieldName: K) => boolean;
  isFieldComputed: <K extends keyof T>(fieldName: K) => boolean;

  // Operations
  submit: () => Promise<void>;
  refreshSchema: () => Promise<void>;
  validateForm: () => Promise<boolean>;
  clearErrors: () => void;
}
```

## Usage Example

From `ecommerce-app/src/pages/SellerProductsPage.tsx`. This example demonstrates all imported types:

```tsx
import { useState } from "react";
import { useTable, useForm } from "@ram_28/kf-ai-sdk";
import type {
  UseFormOptions,
  UseFormReturn,
  FormOperation,
  ProcessedField,
  ProcessedSchema,
  BackendFieldDefinition,
  BackendSchema,
  RuleExecutionContext,
} from "@ram_28/kf-ai-sdk";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type SellerProduct = ProductType<typeof Roles.Seller>;

export function SellerProductsPage() {
  const product = new Product(Roles.Seller);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  // FormOperation - "create" or "update"
  const [formMode, setFormMode] = useState<FormOperation>("create");

  // Table for listing
  const table = useTable<SellerProduct>({
    source: product._id,
    columns: [{ fieldId: "Title" }, { fieldId: "Price" }],
    enablePagination: true,
  });

  // UseFormOptions<T> - configuration for the hook
  const formOptions: UseFormOptions<SellerProduct> = {
    source: product._id,
    operation: formMode,              // FormOperation: "create" | "update"
    recordId: selectedProduct?._id,   // Required for update mode
    enabled: showForm,                // Only fetch when form is visible
    mode: "onBlur",                   // Validate on blur
    defaultValues: {
      Title: "",
      Price: 0,
      Stock: 0,
    },
    // RuleExecutionContext<T> - context for custom computation rules
    onComputationRule: async (context: RuleExecutionContext<SellerProduct>) => {
      // Access current values
      const price = context.getValue("Price");
      const mrp = context.getValue("MRP");

      // Return computed values
      if (mrp > 0) {
        return {
          Discount: ((mrp - price) / mrp) * 100,
        };
      }
      return {};
    },
    onSuccess: () => {
      setShowForm(false);
      table.refetch();
    },
    onError: (error: Error) => console.error(error.message),
    onSchemaError: (error: Error) => console.error("Schema error:", error.message),
    onSubmitError: (error: Error) => console.error("Submit error:", error.message),
  };

  // UseFormReturn<T> - the hook return type
  const form: UseFormReturn<SellerProduct> = useForm<SellerProduct>(formOptions);

  // ProcessedSchema - access schema information
  const displaySchemaInfo = () => {
    const schema: ProcessedSchema | null = form.processedSchema;
    if (!schema) return null;

    return (
      <div>
        <p>Required fields: {schema.requiredFields.join(", ")}</p>
        <p>Computed fields: {schema.computedFields.join(", ")}</p>
        <p>Field order: {schema.fieldOrder.join(", ")}</p>
      </div>
    );
  };

  // ProcessedField - access individual field metadata
  const renderFieldWithMeta = (fieldName: keyof SellerProduct) => {
    const field: ProcessedField | null = form.getField(fieldName);
    if (!field) return null;

    return (
      <div key={field.id}>
        <label>
          {field.label}
          {field.required && <span className="required">*</span>}
          {field.computed && <span className="computed">(auto)</span>}
        </label>
        {field.computed ? (
          // Computed fields are read-only
          <input
            value={form.watch(fieldName) || field.defaultValue || ""}
            readOnly
            disabled
          />
        ) : (
          <input
            {...form.register(fieldName)}
            type={field.type === "number" ? "number" : "text"}
            min={field.min}
            max={field.max}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
          />
        )}
        {field.options && (
          <select {...form.register(fieldName)}>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
    );
  };

  // BackendSchema - raw schema from API
  const displayRawSchema = () => {
    const schema: BackendSchema | null = form.schema;
    if (!schema) return null;

    return (
      <div>
        <p>Business Object: {schema.name}</p>
        <p>Field count: {schema.fields.length}</p>
        {schema.fields.map((field: BackendFieldDefinition) => (
          <div key={field.name}>
            {field.displayName || field.name} ({field.dataType})
            {field.isMandatory && " - Required"}
            {field.isComputed && " - Computed"}
          </div>
        ))}
      </div>
    );
  };

  // Field helpers
  const checkFieldProperties = () => {
    console.log("Is Title required?", form.isFieldRequired("Title"));
    console.log("Is Discount computed?", form.isFieldComputed("Discount"));
    console.log("Computed fields:", form.computedFields);
    console.log("Required fields:", form.requiredFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.handleSubmit()();
  };

  const handleCreate = () => {
    setFormMode("create");
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEdit = (item: SellerProduct) => {
    setFormMode("update");
    setSelectedProduct(item);
    setShowForm(true);
  };

  return (
    <div>
      <button onClick={handleCreate}>Add Product</button>

      {/* Table */}
      <table>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id}>
              <td>{row.Title}</td>
              <td>${row.Price}</td>
              <td><button onClick={() => handleEdit(row)}>Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Form Dialog */}
      {showForm && (
        <dialog open>
          {form.isLoadingInitialData ? (
            <div>Loading form...</div>
          ) : form.loadError ? (
            <div>
              <p>Error: {form.loadError.message}</p>
              <button onClick={() => form.refreshSchema()}>Retry</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Schema Info */}
              {displaySchemaInfo()}

              {/* Title Field */}
              <div>
                <label>
                  Title {form.isFieldRequired("Title") && "*"}
                </label>
                <input {...form.register("Title")} />
                {form.errors.Title && (
                  <span className="error">{form.errors.Title.message}</span>
                )}
              </div>

              {/* Price Field */}
              <div>
                <label>Price *</label>
                <input type="number" step="0.01" {...form.register("Price")} />
                {form.errors.Price && (
                  <span className="error">{form.errors.Price.message}</span>
                )}
              </div>

              {/* Computed Discount Field */}
              <div>
                <label>Discount % (computed)</label>
                <input
                  value={(form.watch("Discount") || 0).toFixed(2)}
                  readOnly
                  disabled
                />
              </div>

              {/* Cross-field validation errors */}
              {form.errors.root && (
                <div className="error-banner">
                  {Object.values(form.errors.root).map((err, i) => (
                    <p key={i}>{(err as any).message}</p>
                  ))}
                </div>
              )}

              {/* Submit error */}
              {form.submitError && (
                <div className="error">{form.submitError.message}</div>
              )}

              {/* Actions */}
              <div>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={form.isSubmitting || !form.isValid}>
                  {form.isSubmitting
                    ? "Saving..."
                    : formMode === "create" ? "Create" : "Update"}
                </button>
              </div>
            </form>
          )}
        </dialog>
      )}
    </div>
  );
}
```

**Type explanations:**

| Type | Purpose | Where Used |
|------|---------|------------|
| `FormOperation` | "create" \| "update" | `options.operation`, `formMode` state |
| `UseFormOptions<T>` | Hook configuration | `useForm(options)` |
| `UseFormReturn<T>` | Hook return with all methods | Return value of `useForm()` |
| `ProcessedField` | Field metadata with validation rules | `form.getField()` return value |
| `ProcessedSchema` | Full schema with field lists | `form.processedSchema` |
| `BackendFieldDefinition` | Raw field from API | `form.schema.fields[]` |
| `BackendSchema` | Raw schema from API | `form.schema` |
| `RuleExecutionContext<T>` | Context for computation callbacks | `onComputationRule` callback parameter |

## API Quick Reference

### Form Methods

```typescript
form.register("fieldName")           // Register input (type-safe)
form.handleSubmit()                  // Returns submit handler
form.watch("fieldName")              // Watch field value
form.setValue("fieldName", value)    // Set field value
form.reset()                         // Reset form
form.getValues()                     // Get all values
form.trigger("fieldName")            // Trigger validation
```

### State

```typescript
form.errors                          // Field errors (FieldErrors<T>)
form.errors.root                     // Cross-field validation errors
form.isValid                         // All validations pass
form.isDirty                         // Form has changes
form.isSubmitting                    // Submit in progress
```

### Loading & Errors

```typescript
form.isLoadingInitialData            // Schema + record loading
form.isLoadingRecord                 // Just record loading
form.loadError                       // Schema/record load error
form.submitError                     // Submission error
```

### Schema Info

```typescript
form.schema                          // BackendSchema | null
form.processedSchema                 // ProcessedSchema | null
form.computedFields                  // Array of computed field names
form.requiredFields                  // Array of required field names
form.getField("fieldName")           // ProcessedField | null
form.isFieldRequired("fieldName")    // boolean
form.isFieldComputed("fieldName")    // boolean
```

### Operations

```typescript
form.submit()                        // Programmatic submit
form.refreshSchema()                 // Reload schema
form.validateForm()                  // Validate all fields
form.clearErrors()                   // Clear all errors
```
