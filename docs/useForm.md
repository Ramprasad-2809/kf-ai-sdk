# useForm

## Brief Description

- Integrates react-hook-form with backend Business Data Object (BDO) schemas for automatic validation and computed field handling
- Fetches schema metadata from the API and generates validation rules, default values, and field permissions automatically
- Supports both create and update operations with automatic draft API calls for server-side computed fields
- Provides flattened state accessors (`errors`, `isValid`, `isDirty`) alongside react-hook-form's standard methods

## Type Reference

```typescript
import { useForm } from "@ram_28/kf-ai-sdk";
import type {
  // Core types
  UseFormOptions,
  UseFormReturn,
  FormOperation,
  FormMode,

  // Form field configuration
  FormFieldConfig,
  FormSchemaConfig,
  FormFieldType,
  SelectOption,
  FieldPermission,

  // Result types
  FieldValidationResult,
  SubmissionResult,

  // BDO Schema types (advanced)
  BDOSchema,
  BDOFieldDefinition,
  SchemaValidationRule,
} from "@ram_28/kf-ai-sdk";

// Error utilities
import {
  parseApiError,
  isNetworkError,
  isValidationError,
  clearFormCache,
} from "@ram_28/kf-ai-sdk";

// Re-exported from react-hook-form
import type {
  UseFormRegister,
  FieldErrors,
  FormState,
  Path,
  PathValue,
} from "react-hook-form";

// FieldErrors type from react-hook-form
// Maps field names to their error objects (message, type, etc.)
// Used in handleSubmit's onError callback for validation errors
type FieldErrors<T> = {
  [K in keyof T]?: {
    type: string;
    message?: string;
    ref?: React.RefObject<any>;
  };
} & {
  root?: Record<string, { type: string; message?: string }>; // Cross-field errors
};

// FormState type from react-hook-form
// Contains all form state information
interface FormState<T> {
  isDirty: boolean; // Form has been modified
  isValid: boolean; // All validations pass
  isSubmitting: boolean; // Form is being submitted
  isSubmitted: boolean; // Form has been submitted at least once
  isSubmitSuccessful: boolean; // Last submission was successful
  isLoading: boolean; // Form is loading async default values
  isValidating: boolean; // Form is validating
  submitCount: number; // Number of times form was submitted
  errors: FieldErrors<T>; // Current validation errors
  touchedFields: Partial<Record<keyof T, boolean>>; // Fields that have been touched
  dirtyFields: Partial<Record<keyof T, boolean>>; // Fields that have been modified
}

// Form operation type
type FormOperation = "create" | "update";

// Form field input types
type FormFieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "date"
  | "datetime-local"
  | "checkbox"
  | "select"
  | "textarea"
  | "reference";

// Select option for dropdown fields
interface SelectOption {
  value: any;
  label: string;
}

// Field permission for current user
interface FieldPermission {
  editable: boolean;
  readable: boolean;
  hidden: boolean;
}

// Field rule IDs by category
interface FieldRuleIds {
  validation: string[];
  computation: string[];
  businessLogic: string[];
}

// Form field configuration for rendering
interface FormFieldConfig {
  name: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  computed: boolean;
  defaultValue?: any;
  options?: SelectOption[];
  validation: any;
  description?: string;
  _bdoField: BDOFieldDefinition;
  permission: FieldPermission;
  rules: FieldRuleIds;
}

// Form schema configuration after processing
interface FormSchemaConfig {
  fields: Record<string, FormFieldConfig>;
  fieldOrder: string[];
  computedFields: string[];
  requiredFields: string[];
  crossFieldValidation: SchemaValidationRule[];
  rules: {
    validation: Record<string, SchemaValidationRule>;
    computation: Record<string, SchemaValidationRule>;
    businessLogic: Record<string, SchemaValidationRule>;
  };
  fieldRules: Record<string, FieldRuleIds>;
  rolePermissions?: Record<string, RolePermission>;
}

// BDO field definition structure
interface BDOFieldDefinition {
  Id: string;
  Name: string;
  Type:
    | "String"
    | "Number"
    | "Boolean"
    | "Date"
    | "DateTime"
    | "Reference"
    | "Array"
    | "Object";
  Required?: boolean;
  Unique?: boolean;
  DefaultValue?: DefaultValueExpression;
  Formula?: ComputedFieldFormula;
  Computed?: boolean;
  Validation?: string[] | SchemaValidationRule[];
  Values?: FieldOptionsConfig;
  Description?: string;
}

// BDO schema structure
interface BDOSchema {
  Id: string;
  Name: string;
  Kind: "BusinessObject";
  Description: string;
  Rules: {
    Computation?: Record<string, SchemaValidationRule>;
    Validation?: Record<string, SchemaValidationRule>;
    BusinessLogic?: Record<string, SchemaValidationRule>;
  };
  Fields: Record<string, BDOFieldDefinition>;
  RolePermission: Record<string, RolePermission>;
  Roles: Record<string, { Name: string; Description: string }>;
}

// Field validation result
interface FieldValidationResult<T = Record<string, any>> {
  isValid: boolean;
  message?: string;
  fieldName?: keyof T;
}

// Form submission result
interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: Error;
  recordId?: string;
}

// Hook options
interface UseFormOptions<T> {
  source: string;
  operation: FormOperation;
  recordId?: string;
  defaultValues?: Partial<T>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  enabled?: boolean;
  userRole?: string;
  schema?: BDOSchema;
  draftOnEveryChange?: boolean;
  onSchemaError?: (error: Error) => void; // Schema loading errors only
}

// Hook return type
interface UseFormReturn<T> {
  // React Hook Form methods
  register: UseFormRegister<T>;
  /**
   * handleSubmit follows RHF pattern with optional callbacks:
   * - onSuccess: Called with API response data on successful submission
   * - onError: Called with FieldErrors (validation) or Error (API failure)
   *
   * Usage:
   *   form.handleSubmit()                    // No callbacks
   *   form.handleSubmit(onSuccess)           // Success only
   *   form.handleSubmit(onSuccess, onError)  // Both callbacks
   *   form.handleSubmit(undefined, onError)  // Error only
   */
  handleSubmit: (
    onSuccess?: (data: T, e?: React.FormEvent) => void | Promise<void>,
    onError?: (
      error: FieldErrors<T> | Error,
      e?: React.FormEvent,
    ) => void | Promise<void>,
  ) => (e?: React.FormEvent) => Promise<void>;
  watch: <K extends Path<T>>(
    name?: K,
  ) => K extends Path<T> ? PathValue<T, K> : T;
  setValue: <K extends Path<T>>(name: K, value: PathValue<T, K>) => void;
  reset: (values?: T) => void;

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
  hasError: boolean;

  // Schema info
  schema: BDOSchema | null;
  schemaConfig: FormSchemaConfig | null;
  computedFields: Array<keyof T>;
  requiredFields: Array<keyof T>;

  // Field helpers
  getField: <K extends keyof T>(fieldName: K) => FormFieldConfig | null;
  getFields: () => Record<keyof T, FormFieldConfig>;
  hasField: <K extends keyof T>(fieldName: K) => boolean;
  isFieldRequired: <K extends keyof T>(fieldName: K) => boolean;
  isFieldComputed: <K extends keyof T>(fieldName: K) => boolean;

  // Operations
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
  FormFieldConfig,
  FormSchemaConfig,
  BDOFieldDefinition,
  BDOSchema,
} from "@ram_28/kf-ai-sdk";
import type { FieldErrors } from "react-hook-form";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

// Get the typed product for the Seller role (who can create/update products)
type SellerProduct = ProductType<typeof Roles.Seller>;

function ProductManagementPage() {
  // Instantiate the Product source with role
  const product = new Product(Roles.Seller);

  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(
    null,
  );
  const [formMode, setFormMode] = useState<FormOperation>("create");

  // Table for listing products
  const table = useTable<SellerProduct>({
    source: product._id,
    columns: [
      { fieldId: "Title", label: "Name" },
      { fieldId: "Price", label: "Price" },
      { fieldId: "Discount", label: "Discount %" },
    ],
    enablePagination: true,
  });

  // Form configuration with all options
  const formOptions: UseFormOptions<SellerProduct> = {
    source: product._id,
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
    onSchemaError: (error: Error) =>
      console.error("Schema error:", error.message),
  };

  const form: UseFormReturn<SellerProduct> =
    useForm<SellerProduct>(formOptions);

  // Handle form submission with new RHF-style callbacks
  const onFormSuccess = (data: SellerProduct) => {
    console.log("Product saved:", data);
    setShowForm(false);
    table.refetch();
  };

  const onFormError = (error: FieldErrors<SellerProduct> | Error) => {
    if (error instanceof Error) {
      // API error
      console.error("Submit error:", error.message);
    } else {
      // Validation errors (FieldErrors)
      console.error("Validation errors:", error);
    }
  };

  // Access processed schema
  const displaySchemaInfo = () => {
    const schema: FormSchemaConfig | null = form.schemaConfig;
    if (!schema) return null;

    return (
      <div className="schema-info">
        <p>Required: {schema.requiredFields.join(", ")}</p>
        <p>Computed: {schema.computedFields.join(", ")}</p>
        <p>Field Order: {schema.fieldOrder.join(", ")}</p>
      </div>
    );
  };

  // Render a field using FormFieldConfig metadata
  const renderField = (fieldName: keyof SellerProduct) => {
    const field: FormFieldConfig | null = form.getField(fieldName);
    if (!field || field.permission.hidden) return null;

    const isDisabled = !field.permission.editable || field.computed;
    const error = form.errors[fieldName];

    return (
      <div key={field.name} className="form-field">
        <label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="required">*</span>}
          {field.computed && <span className="computed">(auto)</span>}
        </label>

        {field.type === "select" && field.options ? (
          <select
            id={field.name}
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
            id={field.name}
            type={field.type === "number" ? "number" : "text"}
            value={form.watch(fieldName as any) ?? field.defaultValue ?? ""}
            readOnly
            disabled
          />
        ) : (
          <input
            id={field.name}
            type={field.type === "number" ? "number" : "text"}
            disabled={isDisabled}
            {...form.register(fieldName as any)}
          />
        )}

        {error && <span className="error">{error.message as string}</span>}
      </div>
    );
  };

  // Access raw BDO schema
  const displayRawSchema = () => {
    const schema: BDOSchema | null = form.schema;
    if (!schema) return null;

    return (
      <details>
        <summary>Raw Schema: {schema.Name}</summary>
        <ul>
          {Object.entries(schema.Fields).map(
            ([fieldName, field]: [string, BDOFieldDefinition]) => (
              <li key={fieldName}>
                {field.Name || fieldName} ({field.Type})
                {field.Required && " - Required"}
                {field.Computed && " - Computed"}
              </li>
            ),
          )}
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

  // Handle form submission - use the new RHF-style API
  // Note: form.handleSubmit returns a function that handles preventDefault internally

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
            <form onSubmit={form.handleSubmit(onFormSuccess, onFormError)}>
              <h2>
                {formMode === "create" ? "Create Product" : "Edit Product"}
              </h2>

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
                    <p key={i} className="error">
                      {(err as any).message}
                    </p>
                  ))}
                </div>
              )}

              {/* Note: Submit errors are now handled via onError callback */}

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

## Error Utilities

```typescript
import {
  parseApiError,
  isNetworkError,
  isValidationError,
  clearFormCache,
} from "@ram_28/kf-ai-sdk";

// Parse API error to user-friendly message
const message = parseApiError(error); // "Failed to save: Invalid data"

// Check error type for specific handling
if (isNetworkError(error)) {
  showOfflineMessage();
} else if (isValidationError(error)) {
  showValidationErrors();
}

// Clear form schema cache (useful after schema changes)
clearFormCache();
```
