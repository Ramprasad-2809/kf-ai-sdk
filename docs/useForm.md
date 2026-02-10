# Form SDK API

This Form SDK API provides React hooks for building forms with automatic validation,
API integration, and type-safe field handling.

## Imports

```typescript
import { useForm, ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormItemType,
  FormRegisterType,
  HandleSubmitType,
  FormOperationType,
  ValidationModeType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from "@ram_28/kf-ai-sdk/form/types";

// For filter conditions in forms
import { ConditionOperator, GroupOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
```

## Type Definitions

### UseFormOptionsType

```typescript
interface UseFormOptionsType<B extends BaseBdo<any, any, any>> {
  // Required: The BDO instance to use
  bdo: B;

  // For edit mode - fetches existing record automatically
  recordId?: string;

  // Explicit operation (auto-inferred from recordId if not provided)
  // Use FormOperation.Create or FormOperation.Update
  operation?: FormOperationType;

  // Initial form values (for create mode)
  defaultValues?: Partial<EditableFieldType>;

  // Validation timing (default: ValidationMode.OnBlur)
  // Use ValidationMode constant for type-safety
  mode?: ValidationModeType;

  // Enable draft API for computed fields (default: false)
  enableDraft?: boolean;
}
```

### UseFormReturnType

```typescript
interface UseFormReturnType<B extends BaseBdo<any, any, any>> {
  // ============================================================
  // CORE
  // ============================================================

  // Item proxy with typed field accessors
  item: FormItemType<EditableFieldType, ReadonlyFieldType>;

  // BDO reference and operation info
  bdo: B;
  operation: FormOperationType;  // FormOperation.Create or FormOperation.Update
  recordId?: string;

  // Smart register (auto-disables readonly fields)
  register: FormRegisterType<EditableFieldType, ReadonlyFieldType>;

  // Custom handleSubmit (handles API call + payload filtering)
  handleSubmit: HandleSubmitType;

  // ============================================================
  // REACT HOOK FORM METHODS
  // ============================================================

  watch: UseFormWatch<AllFieldsType>;
  setValue: UseFormSetValue<EditableFieldType>;
  getValues: UseFormGetValues<AllFieldsType>;
  reset: UseFormReset<AllFieldsType>;
  trigger: UseFormTrigger<AllFieldsType>;
  control: Control<AllFieldsType>;

  // ============================================================
  // FORM STATE
  // ============================================================

  formState: FormState<AllFieldsType>;
  errors: FieldErrors<AllFieldsType>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
  dirtyFields: Partial<Record<keyof AllFieldsType, boolean>>;

  // ============================================================
  // LOADING & ERROR
  // ============================================================

  isLoading: boolean;      // Fetching record data
  isFetching: boolean;     // Same as isLoading
  loadError: Error | null; // Schema/record fetch error

  // ============================================================
  // DRAFT (OPTIONAL)
  // ============================================================

  draftId?: string;
  isCreatingDraft?: boolean;
}
```

### FormItemType (Item Proxy)

```typescript
type FormItemType<TEditable, TReadonly> = {
  // Editable field accessors
  [K in keyof TEditable]: EditableFormFieldAccessorType<TEditable[K]>;
} & {
  // Readonly field accessors
  [K in keyof TReadonly]: ReadonlyFormFieldAccessorType<TReadonly[K]>;
} & {
  // Direct access
  readonly _id: string | undefined;

  // Methods
  toJSON(): Partial<TEditable & TReadonly>;
  validate(): Promise<boolean>;
};
```

### Field Accessor Types

```typescript
// For editable fields
interface EditableFormFieldAccessorType<T> {
  readonly meta: FieldMetaType;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResultType;
}

// For readonly fields (no set method)
interface ReadonlyFormFieldAccessorType<T> {
  readonly meta: FieldMetaType;
  get(): T | undefined;
  validate(): ValidationResultType;
}
```

---

## Basic Example

### Create Mode

```tsx
import { useMemo } from "react";
import { useForm, ValidationMode } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormItemType,
  FormRegisterType,
  HandleSubmitType,
} from "@ram_28/kf-ai-sdk/form/types";
import type { FieldErrors } from "react-hook-form";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
import { SellerProduct } from "../bdo/seller/Product";
import type {
  SellerProductEditableFieldType,
  SellerProductReadonlyFieldType,
} from "../bdo/seller/Product";

function CreateProductForm() {
  // 1. Instantiate BDO (memoized)
  const product: SellerProduct = useMemo(() => new SellerProduct(), []);

  // 2. Form options with explicit type
  const formOptions: UseFormOptionsType<SellerProduct> = {
    bdo: product,
    defaultValues: {
      Title: "",
      Price: 0,
      Stock: 0,
    } satisfies Partial<SellerProductEditableFieldType>,
    mode: ValidationMode.OnBlur,
  };

  // 3. Initialize form with typed destructuring
  const {
    register,
    handleSubmit,
    item,
    errors,
    isSubmitting,
  }: {
    register: FormRegisterType<SellerProductEditableFieldType, SellerProductReadonlyFieldType>;
    handleSubmit: HandleSubmitType<CreateUpdateResponseType>;
    item: FormItemType<SellerProductEditableFieldType, SellerProductReadonlyFieldType>;
    errors: FieldErrors<SellerProductEditableFieldType & SellerProductReadonlyFieldType>;
    isSubmitting: boolean;
  } = useForm(formOptions);

  // 4. Typed handlers
  const onSuccess = (data: CreateUpdateResponseType): void => {
    console.log("Created with ID:", data._id);
  };

  const onError = (error: FieldErrors | Error): void => {
    if (error instanceof Error) {
      console.error("API Error:", error.message);
    } else {
      console.error("Validation errors:", error);
    }
  };

  // Type for item proxy
  type ProductItem = FormItemType<
    SellerProductEditableFieldType,
    SellerProductReadonlyFieldType
  >;

  return (
    <form onSubmit={handleSubmit(onSuccess, onError)}>
      {/* Use field.meta.id for register */}
      <div>
        <label>{product.Title.meta.label}</label>
        <input {...register(product.Title.meta.id)} />
        {errors.Title && <span>{errors.Title.message}</span>}
      </div>

      <div>
        <label>{product.Price.meta.label}</label>
        <input type="number" {...register(product.Price.meta.id)} />
        {errors.Price && <span>{errors.Price.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

### Edit Mode

```tsx
import { useMemo } from "react";
import { useForm, ValidationMode } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
} from "@ram_28/kf-ai-sdk/form/types";
import type { FieldErrors } from "react-hook-form";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
import { SellerProduct } from "../bdo/seller/Product";
import type {
  SellerProductEditableFieldType,
  SellerProductReadonlyFieldType,
} from "../bdo/seller/Product";

interface EditProductFormProps {
  productId: string;
  onClose: () => void;
}

function EditProductForm({ productId, onClose }: EditProductFormProps) {
  const product: SellerProduct = useMemo(() => new SellerProduct(), []);

  // Form options for edit mode
  const formOptions: UseFormOptionsType<SellerProduct> = {
    bdo: product,
    recordId: productId,  // Triggers edit mode - fetches existing record
    mode: ValidationMode.OnBlur,
  };

  // Typed destructuring
  const {
    register,
    handleSubmit,
    item,
    errors,
    isLoading,
    isSubmitting,
    loadError,
  }: {
    register: FormRegisterType<SellerProductEditableFieldType, SellerProductReadonlyFieldType>;
    handleSubmit: HandleSubmitType<CreateUpdateResponseType>;
    item: FormItemType<SellerProductEditableFieldType, SellerProductReadonlyFieldType>;
    errors: FieldErrors<SellerProductEditableFieldType & SellerProductReadonlyFieldType>;
    isLoading: boolean;
    isSubmitting: boolean;
    loadError: Error | null;
  } = useForm(formOptions);

  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div>Error: {loadError.message}</div>;

  const onSuccess = (data: CreateUpdateResponseType): void => {
    console.log("Updated:", data._id);
    onClose();
  };

  const onError = (error: FieldErrors | Error): void => {
    console.error("Error:", error);
  };

  return (
    <form onSubmit={handleSubmit(onSuccess, onError)}>
      {/* Readonly fields are auto-disabled */}
      <div>
        <label>{product.ASIN.meta.label}</label>
        <input {...register(product.ASIN.meta.id)} />
        {/* This input is automatically disabled: true for readonly fields */}
      </div>

      {/* Editable fields */}
      <div>
        <label>{product.Title.meta.label}</label>
        <input {...register(product.Title.meta.id)} />
        {errors.Title && <span>{errors.Title.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
```

---

## register() Function

The `register` function extends React Hook Form's standard register with automatic readonly field handling.

### Behavior

```typescript
// For editable fields - standard result
register(product.Title.meta.id)
// => UseFormRegisterReturn

// For readonly fields - includes disabled: true
register(product.ASIN.meta.id)
// => UseFormRegisterReturn & { disabled: true }
```

### Usage

```tsx
// Always use field.meta.id (not hardcoded strings)
<input {...register(product.Title.meta.id)} />
<input {...register(product.Price.meta.id)} />

// Readonly fields are auto-disabled
<input {...register(product.ASIN.meta.id)} />  // disabled: true added automatically

// With additional options
<input {...register(product.Email.meta.id, { required: true })} />
```

---

## handleSubmit() Function

Custom handleSubmit that handles API calls automatically and filters payload to editable fields only.

### Type

```typescript
type HandleSubmitType<TRead = unknown> = (
  onSuccess?: (data: TRead, e?: React.BaseSyntheticEvent) => void | Promise<void>,
  onError?: (error: FieldErrors | Error, e?: React.BaseSyntheticEvent) => void | Promise<void>,
) => (e?: React.BaseSyntheticEvent) => Promise<void>;
```

### Execution Flow

1. Validation runs (type + expression validation)
2. If **valid**: Filters payload to editable fields -> Calls `bdo.create()` or `bdo.update()` -> Calls `onSuccess(result)`
3. If **invalid**: Calls `onError(FieldErrors)`
4. API errors: Calls `onError(Error)`

### Usage

```tsx
const onSuccess = (data: CreateUpdateResponseType) => {
  console.log("Saved with ID:", data._id);
  router.push("/products");
};

const onError = (error: FieldErrors | Error) => {
  if (error instanceof Error) {
    // API error
    toast.error(`Failed: ${error.message}`);
  } else {
    // Validation errors (already shown by field error messages)
    toast.error("Please fix the errors above");
  }
};

<form onSubmit={handleSubmit(onSuccess, onError)}>
  {/* form fields */}
</form>
```

---

## item Proxy

The `item` object provides field-level access with typed accessors.

### Field Access

```tsx
// Get field value
const title = item.Title.get();

// Set field value (editable fields only)
item.Title.set("New Title");

// Access field metadata
item.Title.meta.id        // "Title"
item.Title.meta.label     // "Product Title"
item.Title.meta.isEditable // true

// Validate single field
const result = item.Title.validate();
// => { valid: boolean, errors: string[] }

// Direct _id access
const recordId = item._id;

// Get all values as JSON
const data = item.toJSON();

// Validate all fields
const isValid = await item.validate();
```

### Readonly Field Behavior

```tsx
// Readonly fields don't have set() method
item.ASIN.get()           // Works
item.ASIN.set("...")      // TypeScript error - method doesn't exist
item.ASIN.meta.isEditable // false
```

---

## Validation

useForm provides two-phase validation:

### Phase 1: Type Validation
From field classes (StringField, NumberField, etc.)

### Phase 2: Expression Validation
From backend schema rules (automatically fetched)

### Validation Timing

Controlled by the `mode` option:

```typescript
import { ValidationMode } from "@ram_28/kf-ai-sdk/form";

useForm({
  bdo: product,
  mode: ValidationMode.OnBlur,    // Validate on blur (default)
  // mode: ValidationMode.OnChange,  // Validate on every keystroke
  // mode: ValidationMode.OnSubmit,  // Validate only on submit
});
```

### Readonly Field Handling

- Readonly fields are **skipped** during validation
- They never generate validation errors
- `register()` auto-adds `disabled: true`

---

## Complete Example

```tsx
import { useMemo, useState } from "react";
import { useForm, ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormItemType,
  FormRegisterType,
  HandleSubmitType,
  FormOperationType,
} from "@ram_28/kf-ai-sdk/form/types";
import type { FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
import { SellerProduct } from "../bdo/seller/Product";
import type {
  SellerProductEditableFieldType,
  SellerProductReadonlyFieldType,
} from "../bdo/seller/Product";

// Combine editable + readonly for errors type
type AllFieldsType = SellerProductEditableFieldType & SellerProductReadonlyFieldType;

interface ProductFormProps {
  productId?: string;  // Undefined for create, defined for edit
  onSuccess: () => void;
}

function ProductForm({ productId, onSuccess }: ProductFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const product: SellerProduct = useMemo(() => new SellerProduct(), []);

  // Form options with explicit types
  const formOptions: UseFormOptionsType<SellerProduct> = {
    bdo: product,
    recordId: productId,
    defaultValues: {
      Title: "",
      Description: "",
      Price: 0,
      Stock: 0,
    } satisfies Partial<SellerProductEditableFieldType>,
    mode: ValidationMode.OnBlur,
  };

  // Typed destructuring
  const {
    register,
    handleSubmit,
    item,
    errors,
    isLoading,
    isSubmitting,
    loadError,
    watch,
    setValue,
    operation,
  }: {
    register: FormRegisterType<SellerProductEditableFieldType, SellerProductReadonlyFieldType>;
    handleSubmit: HandleSubmitType<CreateUpdateResponseType>;
    item: FormItemType<SellerProductEditableFieldType, SellerProductReadonlyFieldType>;
    errors: FieldErrors<AllFieldsType>;
    isLoading: boolean;
    isSubmitting: boolean;
    loadError: Error | null;
    watch: UseFormWatch<AllFieldsType>;
    setValue: UseFormSetValue<SellerProductEditableFieldType>;
    operation: FormOperationType;
  } = useForm(formOptions);

  // Loading state
  if (isLoading) {
    return <div>Loading product...</div>;
  }

  if (loadError) {
    return <div>Error loading product: {loadError.message}</div>;
  }

  // Typed handlers
  const onFormSuccess = (data: CreateUpdateResponseType): void => {
    setGeneralError(null);
    console.log("Saved with ID:", data._id);
    onSuccess();
  };

  const onFormError = (error: FieldErrors | Error): void => {
    if (error instanceof Error) {
      setGeneralError(error.message);
    } else {
      setGeneralError("Please fix the validation errors");
    }
  };

  // Watch for dynamic behavior
  const currentPrice = watch(product.Price.meta.id);

  return (
    <form onSubmit={handleSubmit(onFormSuccess, onFormError)}>
      <h2>{operation === FormOperation.Create ? "Create Product" : "Edit Product"}</h2>

      {generalError && (
        <div className="error-banner">{generalError}</div>
      )}

      {/* Readonly field (auto-disabled) */}
      {operation === FormOperation.Update && (
        <div className="field">
          <label>{product.ASIN.meta.label}</label>
          <input {...register(product.ASIN.meta.id)} />
        </div>
      )}

      {/* Title */}
      <div className="field">
        <label>{product.Title.meta.label}</label>
        <input
          {...register(product.Title.meta.id)}
          placeholder="Enter product title"
        />
        {errors.Title && (
          <span className="error">{errors.Title.message}</span>
        )}
      </div>

      {/* Description */}
      <div className="field">
        <label>{product.Description.meta.label}</label>
        <textarea {...register(product.Description.meta.id)} rows={4} />
        {errors.Description && (
          <span className="error">{errors.Description.message}</span>
        )}
      </div>

      {/* Price */}
      <div className="field">
        <label>{product.Price.meta.label}</label>
        <input
          type="number"
          step="0.01"
          {...register(product.Price.meta.id)}
        />
        {errors.Price && (
          <span className="error">{errors.Price.message}</span>
        )}
        {currentPrice > 1000 && (
          <span className="warning">High price - verify before saving</span>
        )}
      </div>

      {/* Stock */}
      <div className="field">
        <label>{product.Stock.meta.label}</label>
        <input
          type="number"
          {...register(product.Stock.meta.id)}
        />
        {errors.Stock && (
          <span className="error">{errors.Stock.message}</span>
        )}
      </div>

      {/* Category (using setValue for select) */}
      <div className="field">
        <label>{product.Category.meta.label}</label>
        <select
          value={watch(product.Category.meta.id) || ""}
          onChange={(e) => setValue(product.Category.meta.id, e.target.value)}
        >
          <option value="">Select category</option>
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Books">Books</option>
        </select>
        {errors.Category && (
          <span className="error">{errors.Category.message}</span>
        )}
      </div>

      {/* Actions */}
      <div className="actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? (operation === FormOperation.Create ? "Creating..." : "Saving...")
            : (operation === FormOperation.Create ? "Create Product" : "Save Changes")
          }
        </button>
      </div>

      {/* Debug: Show current values */}
      <details>
        <summary>Current Values</summary>
        <pre>{JSON.stringify(item.toJSON(), null, 2)}</pre>
      </details>
    </form>
  );
}
```

---

## Constants Reference

```typescript
import { ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";

// Validation timing
ValidationMode.OnBlur    // "onBlur"
ValidationMode.OnChange  // "onChange"
ValidationMode.OnSubmit  // "onSubmit"
ValidationMode.OnTouched // "onTouched"
ValidationMode.All       // "all"

// Form operation
FormOperation.Create     // "create"
FormOperation.Update     // "update"
```
