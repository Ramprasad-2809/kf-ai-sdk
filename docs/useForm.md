# useForm Hook - Usage Guide

The `useForm` hook is a comprehensive form management solution that integrates React Hook Form with backend-driven schemas, automatic validation, computed fields, and type-safe submission handling.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Features](#features)
  - [Create Operation](#create-operation)
  - [Update Operation](#update-operation)
  - [Computed Fields](#computed-fields)
  - [Validation](#validation)
  - [Error Handling](#error-handling)
- [Complete Example](#complete-example)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Create Form

```tsx
import { useForm } from 'kf-ai-sdk';

interface Product {
  _id?: string;
  Title: string;
  Description: string;
  Price: number;
  Stock: number;
  Category: string;
}

function CreateProductForm() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
    defaultValues: {
      Title: "",
      Description: "",
      Price: 0,
      Stock: 0,
      Category: "Electronics",
    },
    onSuccess: (data) => {
      console.log("Product created:", data);
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  });

  if (form.isLoadingInitialData) {
    return <div>Loading form...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      <div>
        <label>Product Title *</label>
        <input {...form.register("Title")} placeholder="Enter title" />
        {form.errors.Title && (
          <p className="error">{form.errors.Title.message}</p>
        )}
      </div>

      <div>
        <label>Price *</label>
        <input
          {...form.register("Price")}
          type="number"
          step="0.01"
          placeholder="0.00"
        />
        {form.errors.Price && (
          <p className="error">{form.errors.Price.message}</p>
        )}
      </div>

      <div>
        <label>Stock *</label>
        <input {...form.register("Stock")} type="number" placeholder="0" />
        {form.errors.Stock && (
          <p className="error">{form.errors.Stock.message}</p>
        )}
      </div>

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

### Basic Update Form

```tsx
function EditProductForm({ productId }: { productId: string }) {
  const [showForm, setShowForm] = useState(true);

  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "update",
    recordId: productId,
    enabled: showForm,  // Only fetch when dialog is open
    onSuccess: (data) => {
      console.log("Product updated:", data);
      setShowForm(false);
    },
  });

  if (form.isLoadingInitialData) {
    return <div>Loading product data...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Fields will be pre-filled with existing data */}
      <input {...form.register("Title")} />
      <input {...form.register("Price")} type="number" />
      <input {...form.register("Stock")} type="number" />

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Updating..." : "Update Product"}
      </button>
    </form>
  );
}
```

## Core Concepts

### Backend Schema Integration

The hook automatically fetches field definitions from your backend:
- **Field types** (string, number, boolean, date, etc.)
- **Validation rules** (required, min/max, patterns, custom expressions)
- **Computed fields** (auto-calculated based on other fields)
- **Default values**
- **Field permissions** (read-only, editable, hidden by role)

### Automatic Validation

Validation happens at multiple levels:
1. **Type validation** - Automatic based on field type
2. **Field-level validation** - Backend-defined rules
3. **Cross-field validation** - Complex rules involving multiple fields
4. **Client-side + Server-side** - Validated on both for security and UX

### Computed Fields

Fields can be automatically calculated:
- Computed on blur after validation passes
- Uses draft API for server-side computation
- Falls back to client-side if API unavailable
- Read-only in the UI

## API Reference

### useForm(options)

#### Parameters

```typescript
interface UseFormOptions<T> {
  /** Data source identifier (Business Object name) */
  source: string;

  /** Form operation type */
  operation: "create" | "update";

  /** Record ID for update operations */
  recordId?: string;

  /** Default form values */
  defaultValues?: Partial<T>;

  /** Validation mode (default: 'onBlur') */
  mode?: "onBlur" | "onChange" | "onSubmit";

  /** Enable/disable the hook (useful for conditional forms) */
  enabled?: boolean;

  /** User role for permission-based field filtering */
  userRole?: string;

  /** Success callback */
  onSuccess?: (data: T) => void;

  /** Error callback (any error) */
  onError?: (error: Error) => void;

  /** Schema load error callback */
  onSchemaError?: (error: Error) => void;

  /** Submit error callback */
  onSubmitError?: (error: Error) => void;

  /** Skip schema fetching (for testing/manual schema) */
  skipSchemaFetch?: boolean;

  /** Manual schema (use instead of fetching) */
  schema?: BackendSchema;
}
```

#### Return Value

```typescript
interface UseFormReturn<T> {
  // Form Methods (React Hook Form)
  register: UseFormRegister<T>;
  handleSubmit: () => (e?: React.FormEvent) => Promise<void>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  reset: UseFormReset<T>;

  // Flattened Form State (Direct Access - RECOMMENDED)
  errors: FieldErrors<T>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;

  // Legacy (for backward compatibility)
  formState: FormState<T>;

  // Loading States
  isLoadingInitialData: boolean;   // Schema + record data loading
  isLoadingRecord: boolean;         // Just record data loading
  isLoading: boolean;               // Any loading state

  // Error Handling
  loadError: Error | null;          // Schema or record load error
  submitError: Error | null;        // Form submission error
  hasError: boolean;                // Any error present

  // Schema Information
  schema: BackendSchema | null;
  processedSchema: ProcessedSchema | null;
  computedFields: Array<keyof T>;
  requiredFields: Array<keyof T>;

  // Field Helpers
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

## Features

### Create Operation

Create new records with validation and default values.

```tsx
function CreateProductForm() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
    defaultValues: {
      Title: "",
      Description: "",
      Category: "Electronics",
      Price: 0,
      MRP: 0,
      Stock: 0,
      Warehouse: "Warehouse_A",
      ReorderLevel: 10,
      IsActive: true,
    },
    onSuccess: (data) => {
      toast.success("Product created successfully!");
      navigate("/products");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Form fields */}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

**Key Points:**
- Set `operation: "create"`
- Provide `defaultValues` for better UX
- Form resets automatically on successful submission
- No `recordId` needed

### Update Operation

Update existing records with pre-filled data.

```tsx
function EditProductForm({ productId }: { productId: string }) {
  const [showDialog, setShowDialog] = useState(false);

  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "update",
    recordId: productId,
    enabled: showDialog,  // Only fetch when needed
    onSuccess: (data) => {
      toast.success("Product updated!");
      setShowDialog(false);
      refetchProductList();
    },
  });

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asButton>Edit Product</DialogTrigger>

      <DialogContent>
        {form.isLoadingInitialData ? (
          <div>Loading product data...</div>
        ) : (
          <form onSubmit={form.handleSubmit()}>
            {/* Fields auto-populated with existing data */}
            <input
              {...form.register("Title")}
              defaultValue={form.watch("Title")}
            />
            <input
              {...form.register("Price")}
              type="number"
              defaultValue={form.watch("Price")}
            />

            <button type="submit" disabled={form.isSubmitting}>
              Update
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Key Points:**
- Set `operation: "update"`
- Provide `recordId` to identify the record
- Form auto-fetches and populates existing data
- Use `enabled` prop to control when data is fetched
- Form does NOT reset on successful update (preserves changes)

### Computed Fields

Fields that are automatically calculated based on other fields.

```tsx
interface Product {
  Title: string;
  Price: number;
  MRP: number;
  Stock: number;
  ReorderLevel: number;
  Discount: number;      // Computed: (MRP - Price) / MRP * 100
  LowStock: boolean;     // Computed: Stock <= ReorderLevel
}

function ProductForm() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
    defaultValues: {
      Title: "",
      Price: 0,
      MRP: 0,
      Stock: 0,
      ReorderLevel: 10,
    },
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Regular Fields */}
      <div>
        <label>Price (USD) *</label>
        <input {...form.register("Price")} type="number" step="0.01" />
      </div>

      <div>
        <label>MRP (USD) *</label>
        <input {...form.register("MRP")} type="number" step="0.01" />
      </div>

      <div>
        <label>Stock *</label>
        <input {...form.register("Stock")} type="number" />
      </div>

      {/* Computed Fields Section */}
      <div className="computed-fields">
        <h3>Auto-Calculated Fields</h3>

        {/* Discount Percentage */}
        <div>
          <label>Discount %</label>
          <input
            value={(form.watch("Discount") || 0).toFixed(2)}
            readOnly
            disabled
            className="computed-field"
          />
          <p className="hint">
            Auto-calculated from (MRP - Price) ÷ MRP × 100
          </p>
        </div>

        {/* Low Stock Indicator */}
        <div>
          <label>Stock Status</label>
          <div className="status-badge">
            {form.watch("LowStock") ? "⚠️ Low Stock" : "✅ Good Stock"}
          </div>
          <p className="hint">
            Auto-calculated: Stock ≤ Reorder Level
          </p>
        </div>
      </div>

      <button type="submit">Create Product</button>
    </form>
  );
}
```

**How Computed Fields Work:**
1. User fills in dependent fields (Price, MRP, Stock)
2. On blur, validation runs first
3. If validation passes, computation is triggered
4. Draft API is called with current form values
5. Server returns computed values
6. Computed fields are updated automatically
7. Falls back to client-side computation if API fails

**Important Notes:**
- Computed fields are **read-only**
- Computation triggers **after validation passes**
- Uses **debouncing** (300ms) to reduce API calls
- **Not included in form submission** (computed on backend)
- Check if a field is computed: `form.isFieldComputed("Discount")`

### Validation

Multi-level validation system with helpful error messages.

#### Basic Field Validation

```tsx
function ProductForm() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Required Field */}
      <div>
        <label>
          Product Title
          {form.isFieldRequired("Title") && <span className="required">*</span>}
        </label>
        <input
          {...form.register("Title")}
          className={form.errors.Title ? "error" : ""}
        />
        {form.errors.Title && (
          <p className="error-message">{form.errors.Title.message}</p>
        )}
      </div>

      {/* Numeric Field with Validation */}
      <div>
        <label>Price *</label>
        <input
          {...form.register("Price")}
          type="number"
          step="0.01"
          min="0"
        />
        {form.errors.Price && (
          <p className="error-message">{form.errors.Price.message}</p>
        )}
      </div>
    </form>
  );
}
```

#### Cross-Field Validation

Validation rules that involve multiple fields:

```tsx
function ProductForm() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <div>
        <label>Selling Price *</label>
        <input {...form.register("Price")} type="number" />
        {form.errors.Price && <p className="error">{form.errors.Price.message}</p>}
      </div>

      <div>
        <label>Maximum Retail Price (MRP) *</label>
        <input {...form.register("MRP")} type="number" />
        {form.errors.MRP && <p className="error">{form.errors.MRP.message}</p>}
      </div>

      {/* Cross-Field Validation Errors */}
      {form.errors.root && (
        <div className="error-banner">
          <h4>Validation Error</h4>
          <ul>
            {Object.values(form.errors.root).map((err, idx) => (
              <li key={idx}>{(err as any).message}</li>
            ))}
          </ul>
        </div>
      )}

      <button type="submit">Create Product</button>
    </form>
  );
}
```

**Example Cross-Field Rule:**
- Rule: `Price <= MRP` (Selling price cannot exceed MRP)
- Error: Shown in `form.errors.root.crossField0`
- Message: "Selling price cannot be greater than MRP"

#### Validation Modes

```tsx
// Validate on blur (default - best for performance)
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  mode: "onBlur",  // Validates when user leaves field
});

// Validate on every change (more responsive, higher cost)
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  mode: "onChange",  // Validates on every keystroke
});

// Validate only on submit (best for long forms)
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  mode: "onSubmit",  // Only validates when form is submitted
});
```

### Error Handling

Comprehensive error handling for all scenarios.

```tsx
function ProductForm() {
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
    onSuccess: () => {
      toast.success("Product created!");
      setGeneralError(null);
    },
    onError: (error) => {
      // Catch-all error handler
      setGeneralError(error.message);
    },
    onSchemaError: (error) => {
      // Schema loading failed
      setGeneralError(`Configuration Error: ${error.message}`);
    },
    onSubmitError: (error) => {
      // Form submission failed
      setGeneralError(`Submission Failed: ${error.message}`);
    },
  });

  // Schema loading error
  if (form.loadError) {
    return (
      <div className="error-state">
        <h3>Error Loading Form</h3>
        <p>{form.loadError.message}</p>
        <button onClick={() => form.refreshSchema()}>
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (form.isLoadingInitialData) {
    return <div>Loading form configuration...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* General Error Banner */}
      {generalError && (
        <div className="error-banner">
          {generalError}
        </div>
      )}

      {/* Cross-Field Validation Errors */}
      {form.errors.root && (
        <div className="error-banner">
          <p className="font-medium">Validation Error</p>
          <ul>
            {Object.values(form.errors.root).map((err, idx) => (
              <li key={idx}>{(err as any).message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Fields */}
      <div>
        <input {...form.register("Title")} />
        {form.errors.Title && (
          <p className="error">{form.errors.Title.message}</p>
        )}
      </div>

      {/* Submit Error */}
      {form.submitError && (
        <div className="error-banner">
          {form.submitError.message}
        </div>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

**Error Types:**
- `form.loadError` - Schema or record loading failed
- `form.submitError` - Form submission failed
- `form.errors.FieldName` - Field-level validation error
- `form.errors.root` - Cross-field validation errors
- `generalError` - Custom error state for UI

## Complete Example

Full product form with all features from the e-commerce example:

```tsx
import { useState } from "react";
import { useForm } from "kf-ai-sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  _id?: string;
  Title: string;
  Description: string;
  Brand: string;
  Category: "Electronics" | "Books" | "Clothing" | "Home" | "Sports" | "Toys";
  Price: number;
  MRP: number;
  Stock: number;
  Warehouse: "Warehouse_A" | "Warehouse_B" | "Warehouse_C";
  ReorderLevel: number;
  Discount: number;      // Computed
  LowStock: boolean;     // Computed
  IsActive: boolean;
}

export function ProductFormDialog({
  productId,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: {
  productId?: string;
  mode: "create" | "update";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: mode,
    recordId: productId,
    enabled: open,
    defaultValues: {
      Title: "",
      Description: "",
      Category: "Electronics",
      Price: 0,
      MRP: 0,
      Brand: "",
      Stock: 0,
      Warehouse: "Warehouse_A",
      ReorderLevel: 10,
      IsActive: true,
    },
    onSuccess: () => {
      onOpenChange(false);
      setGeneralError(null);
      onSuccess();
    },
    onError: (error) => setGeneralError(error.message),
    onSchemaError: (error) =>
      setGeneralError(`Configuration Error: ${error.message}`),
    onSubmitError: (error) =>
      setGeneralError(`Submission Failed: ${error.message}`),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.handleSubmit()();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Product" : "Edit Product"}
          </DialogTitle>
        </DialogHeader>

        {form.isLoadingInitialData ? (
          <div className="flex flex-col items-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="text-sm text-gray-500">Loading form configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {generalError}
              </div>
            )}

            {/* Cross-Field Validation Errors */}
            {form.errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                <p className="font-medium">Validation Error</p>
                <ul className="list-disc list-inside mt-1">
                  {Object.values(form.errors.root).map((err, idx) => (
                    <li key={idx}>{(err as any).message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <Input
                {...form.register("Title")}
                placeholder="Enter product title"
                className={form.errors.Title ? "border-red-500" : ""}
              />
              {form.errors.Title && (
                <p className="text-red-600 text-sm mt-1">
                  {form.errors.Title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...form.register("Description")}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter product description"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <Input {...form.register("Brand")} placeholder="Enter brand name" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                defaultValue={form.watch("Category") || "Electronics"}
                onValueChange={(value) =>
                  form.setValue("Category", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Home">Home & Garden</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Toys">Toys & Games</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (USD) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register("Price")}
                placeholder="0.00"
                className={form.errors.Price ? "border-red-500" : ""}
              />
              {form.errors.Price && (
                <p className="text-red-600 text-sm mt-1">
                  {form.errors.Price.message}
                </p>
              )}
            </div>

            {/* MRP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Retail Price (USD) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register("MRP")}
                placeholder="0.00"
                className={form.errors.MRP ? "border-red-500" : ""}
              />
              {form.errors.MRP && (
                <p className="text-red-600 text-sm mt-1">
                  {form.errors.MRP.message}
                </p>
              )}
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <Input
                type="number"
                min="0"
                {...form.register("Stock")}
                placeholder="0"
                className={form.errors.Stock ? "border-red-500" : ""}
              />
              {form.errors.Stock && (
                <p className="text-red-600 text-sm mt-1">
                  {form.errors.Stock.message}
                </p>
              )}
            </div>

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse
              </label>
              <Select
                defaultValue={form.watch("Warehouse") || "Warehouse_A"}
                onValueChange={(value) =>
                  form.setValue("Warehouse", value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Warehouse_A">Warehouse A - North</SelectItem>
                  <SelectItem value="Warehouse_B">Warehouse B - South</SelectItem>
                  <SelectItem value="Warehouse_C">Warehouse C - East</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Level
              </label>
              <Input
                type="number"
                min="0"
                {...form.register("ReorderLevel")}
                placeholder="10"
              />
            </div>

            {/* Computed Fields Section */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Computed Fields (Auto-calculated)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount %
                  </label>
                  <Input
                    value={(form.watch("Discount") || 0).toFixed(2)}
                    readOnly
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated from (MRP - Price) ÷ MRP × 100
                  </p>
                </div>

                {/* Low Stock Indicator */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Status
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        form.watch("LowStock")
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {form.watch("LowStock") ? "⚠️ Low Stock" : "✅ Good Stock"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated: Stock ≤ Reorder Level
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Saving...</span>
                  </div>
                ) : mode === "create" ? (
                  "Add Product"
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## Best Practices

### 1. Always Define Types

Use TypeScript interfaces for your form data:

```tsx
interface Product {
  _id?: string;
  Title: string;
  Price: number;
  Stock: number;
  Category: string;
}

const form = useForm<Product>({
  source: "BDO_AmazonProductMaster",
  operation: "create",
});

// TypeScript will validate field names
form.register("Title");    // ✅ Valid
form.register("Invalid");  // ❌ TypeScript error
```

### 2. Handle Loading States

Always show loading indicators for better UX:

```tsx
if (form.isLoadingInitialData) {
  return (
    <div className="loading-state">
      <Spinner />
      <p>Loading form configuration...</p>
    </div>
  );
}
```

### 3. Provide Default Values

Set sensible defaults for better UX:

```tsx
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  defaultValues: {
    Title: "",
    Category: "Electronics",  // Default category
    Price: 0,
    Stock: 0,
    Warehouse: "Warehouse_A",  // Default warehouse
    ReorderLevel: 10,          // Default threshold
    IsActive: true,            // Active by default
  },
});
```

### 4. Use enabled Prop for Conditional Forms

Only fetch data when the form is visible:

```tsx
function EditProductDialog({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    source: "BDO_AmazonProductMaster",
    operation: "update",
    recordId: productId,
    enabled: open,  // Only fetch when dialog is open
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Dialog content */}
    </Dialog>
  );
}
```

### 5. Centralize Error Handling

Use a single state for general errors:

```tsx
const [generalError, setGeneralError] = useState<string | null>(null);

const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  onSuccess: () => setGeneralError(null),
  onError: (error) => setGeneralError(error.message),
  onSchemaError: (error) => setGeneralError(`Config Error: ${error.message}`),
  onSubmitError: (error) => setGeneralError(`Submit Failed: ${error.message}`),
});
```

### 6. Use Flattened Form State

Use the direct properties instead of nested formState:

```tsx
// ✅ Recommended
form.errors
form.isValid
form.isDirty
form.isSubmitting

// ⚠️ Legacy (still works but verbose)
form.formState.errors
form.formState.isValid
form.formState.isDirty
form.formState.isSubmitting
```

### 7. Watch Computed Fields

Use `form.watch()` to display computed values:

```tsx
<div>
  <label>Discount %</label>
  <input
    value={(form.watch("Discount") || 0).toFixed(2)}
    readOnly
    disabled
  />
</div>
```

### 8. Clear Errors on Success

Reset error states when operation succeeds:

```tsx
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  onSuccess: () => {
    setGeneralError(null);
    toast.success("Success!");
    navigate("/products");
  },
});
```

## Common Patterns

### Pattern 1: Form in Dialog/Modal

```tsx
function ProductDialog({
  mode,
  productId,
  open,
  onOpenChange,
  onSuccess,
}: {
  mode: "create" | "update";
  productId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: mode,
    recordId: productId,
    enabled: open,
    onSuccess: () => {
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {form.isLoadingInitialData ? (
          <LoadingState />
        ) : (
          <form onSubmit={form.handleSubmit()}>
            {/* Form fields */}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 2: Multi-Step Form

```tsx
function MultiStepProductForm() {
  const [step, setStep] = useState(1);

  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
  });

  const handleNext = async () => {
    // Validate current step fields
    const fieldsToValidate = step === 1
      ? ["Title", "Description", "Category"]
      : ["Price", "MRP", "Stock"];

    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      setStep(step + 1);
    }
  };

  return (
    <form onSubmit={form.handleSubmit()}>
      {step === 1 && (
        <div>
          <h2>Basic Information</h2>
          <input {...form.register("Title")} />
          <input {...form.register("Description")} />
          <select {...form.register("Category")}>
            {/* Options */}
          </select>
          <button type="button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Pricing & Inventory</h2>
          <input {...form.register("Price")} type="number" />
          <input {...form.register("MRP")} type="number" />
          <input {...form.register("Stock")} type="number" />
          <button type="button" onClick={() => setStep(1)}>
            Back
          </button>
          <button type="submit">Create Product</button>
        </div>
      )}
    </form>
  );
}
```

### Pattern 3: Form with Draft Auto-Save

```tsx
function ProductFormWithAutoSave() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
  });

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (form.isDirty && !form.isSubmitting) {
        const values = form.getValues();
        await saveDraft(values);
        toast.success("Draft saved");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [form.isDirty, form.isSubmitting]);

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Form fields */}
    </form>
  );
}
```

### Pattern 4: Conditional Fields

```tsx
function ProductForm() {
  const form = useForm<Product>({
    source: "BDO_AmazonProductMaster",
    operation: "create",
  });

  const category = form.watch("Category");

  return (
    <form onSubmit={form.handleSubmit()}>
      <select {...form.register("Category")}>
        <option value="Electronics">Electronics</option>
        <option value="Books">Books</option>
        <option value="Clothing">Clothing</option>
      </select>

      {/* Show only for Electronics */}
      {category === "Electronics" && (
        <div>
          <label>Warranty Period (months)</label>
          <input {...form.register("WarrantyPeriod")} type="number" />
        </div>
      )}

      {/* Show only for Clothing */}
      {category === "Clothing" && (
        <div>
          <label>Size</label>
          <select {...form.register("Size")}>
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
          </select>
        </div>
      )}

      <button type="submit">Create Product</button>
    </form>
  );
}
```

## Troubleshooting

### Issue: Form Not Loading

**Symptoms:** Shows "Loading form configuration..." indefinitely

**Solutions:**
1. Check if backend schema endpoint is accessible: `GET /api/bo/{source}/field`
2. Verify `source` parameter matches your Business Object name
3. Check browser console for network errors
4. Use `onSchemaError` callback to debug:

```tsx
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  onSchemaError: (error) => {
    console.error("Schema load error:", error);
  },
});
```

### Issue: Validation Not Working

**Symptoms:** Form submits with invalid data

**Solutions:**
1. Check backend schema has validation rules defined
2. Ensure validation mode is appropriate:
   - `onBlur` - Validates when field loses focus (default)
   - `onChange` - Validates on every change
   - `onSubmit` - Validates only on submit
3. Check validation rules in backend schema
4. Use `validateForm()` to debug:

```tsx
const handleDebug = async () => {
  const isValid = await form.validateForm();
  console.log("Is valid:", isValid);
  console.log("Errors:", form.errors);
};
```

### Issue: Computed Fields Not Updating

**Symptoms:** Computed fields show old or no values

**Solutions:**
1. Ensure dependent fields are validated correctly
2. Check that draft API endpoint exists: `PATCH /api/bo/{source}/draft`
3. Verify backend has computation rules defined
4. Computation only triggers after validation passes
5. Check browser console for API errors

### Issue: Update Form Not Pre-filling

**Symptoms:** Edit form shows empty fields instead of existing data

**Solutions:**
1. Verify `recordId` is provided and correct
2. Check that record exists in backend
3. Ensure `operation` is set to `"update"`
4. Check `enabled` prop is true
5. Use `defaultValue` on inputs:

```tsx
<input
  {...form.register("Title")}
  defaultValue={form.watch("Title")}
/>
```

### Issue: Form Resets Unexpectedly

**Symptoms:** Form clears after successful submission

**Solutions:**
- This is expected behavior for `create` operations
- For `update` operations, form should NOT reset
- If you want to prevent reset on create:

```tsx
const form = useForm({
  source: "BDO_AmazonProductMaster",
  operation: "create",
  onSuccess: (data) => {
    // Don't navigate away if you want to keep the form
    toast.success("Created!");
    // form.reset() is called automatically for create
    // To prevent it, you'd need to modify the form state manually
  },
});
```

### Issue: TypeScript Errors

**Symptoms:** TypeScript complains about field names or types

**Solutions:**
1. Define proper interface for your form data
2. Use generic type parameter: `useForm<MyType>(...)`
3. Ensure field names match between interface and backend
4. Use type assertions carefully:

```tsx
interface Product {
  Title: string;
  Price: number;
  Category: string;
}

const form = useForm<Product>({
  source: "BDO_AmazonProductMaster",
  operation: "create",
});

// ✅ TypeScript validates this
form.register("Title");

// ❌ TypeScript error
form.register("InvalidField");
```

### Issue: Slow Performance

**Symptoms:** Form is sluggish or laggy

**Solutions:**
1. Use `mode: "onBlur"` instead of `"onChange"`
2. Memoize components that don't need frequent updates
3. Reduce number of watched fields
4. Use React DevTools Profiler to identify bottlenecks
5. Consider splitting large forms into multiple steps

---

For more examples, see the [e-commerce example](../examples/e-commerce/) in the repository.
