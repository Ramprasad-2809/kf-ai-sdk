# useForm

## Brief Description

- Integrates react-hook-form with backend Business Object schemas for automatic validation and computed field handling
- Fetches schema metadata from the API and generates validation rules, default values, and field permissions automatically
- Supports both create and update operations with automatic draft API calls for server-side computed fields
- Provides flattened state accessors (`errors`, `isValid`, `isDirty`) alongside react-hook-form's standard methods

## Type Reference

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

// Re-exported from react-hook-form
import type {
  UseFormRegister,
  FieldErrors,
  FormState,
  Path,
  PathValue,
} from "react-hook-form";

// Form operation type
type FormOperation = "create" | "update";

// Processed field with validation rules and metadata
interface ProcessedField {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "datetime" | "currency" | "email" | "select";
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

// Processed schema with field lists
interface ProcessedSchema {
  fields: Record<string, ProcessedField>;
  requiredFields: string[];
  computedFields: string[];
  fieldOrder: string[];
}

// Raw field definition from backend
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

// Raw schema from backend
interface BackendSchema {
  name: string;
  fields: BackendFieldDefinition[];
}

// Context for computation rule callbacks
interface RuleExecutionContext<T> {
  values: T;
  triggerField: keyof T;
  previousValues: T;
  schema: ProcessedSchema;
  getValue: <K extends keyof T>(field: K) => T[K];
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
}

// Hook options
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

// Hook return type
interface UseFormReturn<T> {
  // React Hook Form methods
  register: UseFormRegister<T>;
  handleSubmit: () => (e?: React.FormEvent) => Promise<void>;
  watch: <K extends Path<T>>(name?: K) => K extends Path<T> ? PathValue<T, K> : T;
  setValue: <K extends Path<T>>(name: K, value: PathValue<T, K>) => void;
  reset: (values?: T) => void;
  getValues: () => T;
  trigger: (name?: keyof T | (keyof T)[]) => Promise<boolean>;

  // Flattened state (recommended)
  errors: FieldErrors<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;

  // Legacy (backward compatible)
  formState: FormState<T>;

  // Loading states
  isLoadingInitialData: boolean;
  isLoadingRecord: boolean;
  isLoading: boolean;

  // Error handling
  loadError: Error | null;
  submitError: Error | null;
  hasError: boolean;

  // Schema info
  schema: BackendSchema | null;
  processedSchema: ProcessedSchema | null;
  computedFields: Array<keyof T>;
  requiredFields: Array<keyof T>;

  // Field helpers
  getField: <K extends keyof T>(fieldName: K) => ProcessedField | null;
  getFields: () => Record<keyof T, ProcessedField>;
  hasField: <K extends keyof T>(fieldName: K) => boolean;
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

```tsx
import { useState } from "react";
import { useTable, useForm } from "@ram_28/kf-ai-sdk";
import type {
  UseFormOptions,
  UseFormReturn,
  UseTableOptions,
  UseTableReturn,
  ColumnDefinition,
  FormOperation,
  ProcessedField,
  ProcessedSchema,
  BackendFieldDefinition,
  BackendSchema,
  RuleExecutionContext,
} from "@ram_28/kf-ai-sdk";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

// Get the typed product for the Seller role (who can create/update products)
type SellerProduct = ProductType<typeof Roles.Seller>;

function ProductManagementPage() {
  // Instantiate the Product source with role
  const product = new Product(Roles.Seller);

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [formMode, setFormMode] = useState<FormOperation>("create");

  // Table for listing products
  const table = useTable<SellerProduct>({
    source: product._id, // Use the Business Object ID from the Product class
    columns: [
      { fieldId: "Title", label: "Name" },
      { fieldId: "Price", label: "Price" },
      { fieldId: "Discount", label: "Discount %" },
    ],
    enablePagination: true,
  });

  // Form configuration with all options
  const formOptions: UseFormOptions<SellerProduct> = {
    source: product._id, // Use the Business Object ID from the Product class
    operation: formMode,
    recordId: selectedProduct?._id,
    enabled: showForm,
    mode: "onBlur",
    defaultValues: {
      Title: "",
      Description: "",
      Price: 0,
      MRP: 0,
      Category: "Electronics",
      Stock: 0,
    },
    // Custom computation rule callback
    onComputationRule: async (context: RuleExecutionContext<SellerProduct>) => {
      const price = context.getValue("Price");
      const mrp = context.getValue("MRP");

      // Calculate discount when Price or MRP changes
      if (context.triggerField === "Price" || context.triggerField === "MRP") {
        if (mrp > 0) {
          return {
            Discount: Math.round(((mrp - price) / mrp) * 100),
          };
        }
      }
      return {};
    },
    onSuccess: (data: SellerProduct) => {
      console.log("Product saved:", data);
      setShowForm(false);
      table.refetch();
    },
    onError: (error: Error) => console.error("Form error:", error.message),
    onSchemaError: (error: Error) => console.error("Schema error:", error.message),
    onSubmitError: (error: Error) => console.error("Submit error:", error.message),
  };

  const form: UseFormReturn<SellerProduct> = useForm<SellerProduct>(formOptions);

  // Access processed schema
  const displaySchemaInfo = () => {
    const schema: ProcessedSchema | null = form.processedSchema;
    if (!schema) return null;

    return (
      <div className="schema-info">
        <p>Required: {schema.requiredFields.join(", ")}</p>
        <p>Computed: {schema.computedFields.join(", ")}</p>
        <p>Field Order: {schema.fieldOrder.join(", ")}</p>
      </div>
    );
  };

  // Render a field using ProcessedField metadata
  const renderField = (fieldName: keyof SellerProduct) => {
    const field: ProcessedField | null = form.getField(fieldName);
    if (!field || field.hidden) return null;

    const isDisabled = field.readOnly || field.computed;
    const error = form.errors[fieldName];

    return (
      <div key={field.id} className="form-field">
        <label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="required">*</span>}
          {field.computed && <span className="computed">(auto)</span>}
        </label>

        {field.type === "select" && field.options ? (
          <select
            id={field.id}
            disabled={isDisabled}
            {...form.register(fieldName as any)}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.computed ? (
          <input
            id={field.id}
            type={field.type === "number" ? "number" : "text"}
            value={form.watch(fieldName as any) ?? field.defaultValue ?? ""}
            readOnly
            disabled
          />
        ) : (
          <input
            id={field.id}
            type={field.type === "number" ? "number" : "text"}
            min={field.min}
            max={field.max}
            minLength={field.minLength}
            maxLength={field.maxLength}
            pattern={field.pattern}
            disabled={isDisabled}
            {...form.register(fieldName as any)}
          />
        )}

        {error && <span className="error">{error.message as string}</span>}
      </div>
    );
  };

  // Access raw backend schema
  const displayRawSchema = () => {
    const schema: BackendSchema | null = form.schema;
    if (!schema) return null;

    return (
      <details>
        <summary>Raw Schema: {schema.name}</summary>
        <ul>
          {schema.fields.map((field: BackendFieldDefinition) => (
            <li key={field.name}>
              {field.displayName || field.name} ({field.dataType})
              {field.isMandatory && " - Required"}
              {field.isComputed && " - Computed"}
            </li>
          ))}
        </ul>
      </details>
    );
  };

  // Check field properties using helpers
  const checkFieldStatus = () => {
    console.log("Is Title required?", form.isFieldRequired("Title"));
    console.log("Is Discount computed?", form.isFieldComputed("Discount"));
    console.log("Has Category field?", form.hasField("Category"));
    console.log("All computed fields:", form.computedFields);
    console.log("All required fields:", form.requiredFields);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.handleSubmit()();
  };

  // Open create form
  const handleCreate = () => {
    setFormMode("create");
    setSelectedProduct(null);
    setShowForm(true);
  };

  // Open edit form
  const handleEdit = (productItem: SellerProduct) => {
    setFormMode("update");
    setSelectedProduct(productItem);
    setShowForm(true);
  };

  return (
    <div className="product-management">
      <h1>Products</h1>
      <button onClick={handleCreate}>Add Product</button>

      {/* Product Table */}
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Discount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row: SellerProduct) => (
            <tr key={row._id}>
              <td>{row.Title}</td>
              <td>${row.Price.toFixed(2)}</td>
              <td>{row.Discount}%</td>
              <td>
                <button onClick={() => handleEdit(row)}>Edit</button>
              </td>
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
              <h2>{formMode === "create" ? "Create Product" : "Edit Product"}</h2>

              {/* Schema Info */}
              {displaySchemaInfo()}

              {/* Form Fields */}
              {renderField("Title")}
              {renderField("Description")}
              {renderField("MRP")}
              {renderField("Price")}
              {renderField("Discount")}
              {renderField("Category")}
              {renderField("Stock")}

              {/* Form Status */}
              <div className="form-status">
                {form.isDirty && <span>Unsaved changes</span>}
                {!form.isValid && <span>Please fix validation errors</span>}
              </div>

              {/* Cross-field validation errors */}
              {form.errors.root && (
                <div className="cross-field-errors">
                  {Object.values(form.errors.root).map((err, i) => (
                    <p key={i} className="error">{(err as any).message}</p>
                  ))}
                </div>
              )}

              {/* Submit error */}
              {form.submitError && (
                <div className="submit-error">
                  <p>{form.submitError.message}</p>
                  <button type="button" onClick={form.clearErrors}>
                    Dismiss
                  </button>
                </div>
              )}

              {/* Raw Schema Debug */}
              {displayRawSchema()}

              {/* Form Actions */}
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="button" onClick={() => form.reset()}>
                  Reset
                </button>
                <button type="button" onClick={() => form.validateForm()}>
                  Validate
                </button>
                <button
                  type="submit"
                  disabled={form.isSubmitting || form.isLoading}
                >
                  {form.isSubmitting
                    ? "Saving..."
                    : formMode === "create"
                    ? "Create"
                    : "Update"}
                </button>
              </div>

              {/* Watch specific fields */}
              <div className="field-preview">
                <p>Current Price: ${form.watch("Price")}</p>
                <p>Current Discount: {form.watch("Discount")}%</p>
              </div>
            </form>
          )}
        </dialog>
      )}
    </div>
  );
}
```
