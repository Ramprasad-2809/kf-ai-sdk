# Form SDK API

This Form SDK API provides React hooks for building forms with automatic validation,
API integration, and type-safe field handling.

## Imports

```typescript
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormItemType,
  FormRegisterType,
  HandleSubmitType,
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
// Create mode — no recordId
interface UseFormCreateOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B;
  defaultValues?: Partial<EditableFieldType>;
  mode?: ValidationModeType;
  enableDraft?: boolean;
  enableConstraintValidation?: boolean;  // default: true
  enableExpressionValidation?: boolean;  // default: true
}

// Edit mode — recordId required
interface UseFormEditOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B;
  recordId: string;
  mode?: ValidationModeType;
  enableDraft?: boolean;
  enableConstraintValidation?: boolean;  // default: true
  enableExpressionValidation?: boolean;  // default: true
}

// Explicit operation mode
interface UseFormExplicitOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B;
  operation: "create" | "update";
  recordId?: string;
  defaultValues?: Partial<EditableFieldType>;
  mode?: ValidationModeType;
  enableDraft?: boolean;
  enableConstraintValidation?: boolean;  // default: true
  enableExpressionValidation?: boolean;  // default: true
}

type UseFormOptionsType<B extends BaseBdo<any, any, any>> =
  | UseFormCreateOptionsType<B>
  | UseFormEditOptionsType<B>
  | UseFormExplicitOptionsType<B>;
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
  operation: "create" | "update";
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
  isFetching: boolean;     // True during any background refetch
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
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: false;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResultType;
}

// For readonly fields (no set method)
interface ReadonlyFormFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: true;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  validate(): ValidationResultType;
}
```

### File & Image Value Types

```typescript
// Metadata for an uploaded file or image
interface FileType {
  _id: string;
  _name: string;
  FileName: string;
  FileExtension: string;
  Size: number;
  ContentType: string;
}

type ImageFieldType = FileType | null;  // Single image, nullable
type FileFieldType = FileType[];        // Array of files

// Request a thumbnail or preview variant from the backend
type AttachmentViewType = "thumbnail" | "preview";
```

### File & Image Accessor Types

Image and File fields extend the base accessor with attachment operations.
Editable accessors get `upload` and `deleteAttachment`; readonly accessors only get download.

```typescript
// Editable Image — single file
interface EditableImageFieldAccessorType
  extends EditableFormFieldAccessorType<ImageFieldType> {
  upload(file: File): Promise<FileType>;
  getDownloadUrl(viewType?: AttachmentViewType): Promise<FileDownloadResponseType>;
  deleteAttachment(): Promise<void>;
}

// Readonly Image — download only
interface ReadonlyImageFieldAccessorType
  extends ReadonlyFormFieldAccessorType<ImageFieldType> {
  getDownloadUrl(viewType?: AttachmentViewType): Promise<FileDownloadResponseType>;
}

// Editable File — multi-file
interface EditableFileFieldAccessorType
  extends EditableFormFieldAccessorType<FileFieldType> {
  upload(files: File[]): Promise<FileType[]>;
  getDownloadUrl(attachmentId: string, viewType?: AttachmentViewType): Promise<FileDownloadResponseType>;
  getDownloadUrls(viewType?: AttachmentViewType): Promise<FileDownloadResponseType[]>;
  deleteAttachment(attachmentId: string): Promise<void>;
}

// Readonly File — download only
interface ReadonlyFileFieldAccessorType
  extends ReadonlyFormFieldAccessorType<FileFieldType> {
  getDownloadUrl(attachmentId: string, viewType?: AttachmentViewType): Promise<FileDownloadResponseType>;
  getDownloadUrls(viewType?: AttachmentViewType): Promise<FileDownloadResponseType[]>;
}
```

---

## Basic Example

### Create Mode

```tsx
import { useMemo } from "react";
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { ValidationMode } from "@ram_28/kf-ai-sdk/form";
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
      {/* Use field.id for register */}
      <div>
        <label>{product.Title.label}</label>
        <input {...register(product.Title.id)} />
        {errors.Title && <span>{errors.Title.message}</span>}
      </div>

      <div>
        <label>{product.Price.label}</label>
        <input type="number" {...register(product.Price.id)} />
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
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { ValidationMode } from "@ram_28/kf-ai-sdk/form";
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
        <label>{product.ASIN.label}</label>
        <input {...register(product.ASIN.id)} />
        {/* This input is automatically disabled: true for readonly fields */}
      </div>

      {/* Editable fields */}
      <div>
        <label>{product.Title.label}</label>
        <input {...register(product.Title.id)} />
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
register(product.Title.id)
// => UseFormRegisterReturn

// For readonly fields - includes disabled: true
register(product.ASIN.id)
// => UseFormRegisterReturn & { disabled: true }
```

### Usage

```tsx
// Always use field.id (not hardcoded strings)
<input {...register(product.Title.id)} />
<input {...register(product.Price.id)} />

// Readonly fields are auto-disabled
<input {...register(product.ASIN.id)} />  // disabled: true added automatically

// With additional options
<input {...register(product.Email.id, { required: true })} />
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

// Access field properties
item.Title.id             // "Title"
item.Title.label          // "Product Title"
item.Title.readOnly       // false

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
item.ASIN.readOnly        // true
```

---

## Validation

useForm provides three-phase validation:

### Phase 1: Type Validation
From field classes (StringField, NumberField, etc.)

### Phase 2: Constraint Validation
From field meta constraints (required, string length, number integerPart/fractionPart).
Controlled by the `enableConstraintValidation` option (default: `true`).

### Phase 3: Expression Validation
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
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type {
  UseFormOptionsType,
  UseFormReturnType,
  FormItemType,
  FormRegisterType,
  HandleSubmitType,
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
    operation: "create" | "update";
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
  const currentPrice = watch(product.Price.id);

  return (
    <form onSubmit={handleSubmit(onFormSuccess, onFormError)}>
      <h2>{operation === FormOperation.Create ? "Create Product" : "Edit Product"}</h2>

      {generalError && (
        <div className="error-banner">{generalError}</div>
      )}

      {/* Readonly field (auto-disabled) */}
      {operation === FormOperation.Update && (
        <div className="field">
          <label>{product.ASIN.label}</label>
          <input {...register(product.ASIN.id)} />
        </div>
      )}

      {/* Title */}
      <div className="field">
        <label>{product.Title.label}</label>
        <input
          {...register(product.Title.id)}
          placeholder="Enter product title"
        />
        {errors.Title && (
          <span className="error">{errors.Title.message}</span>
        )}
      </div>

      {/* Description */}
      <div className="field">
        <label>{product.Description.label}</label>
        <textarea {...register(product.Description.id)} rows={4} />
        {errors.Description && (
          <span className="error">{errors.Description.message}</span>
        )}
      </div>

      {/* Price */}
      <div className="field">
        <label>{product.Price.label}</label>
        <input
          type="number"
          step="0.01"
          {...register(product.Price.id)}
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
        <label>{product.Stock.label}</label>
        <input
          type="number"
          {...register(product.Stock.id)}
        />
        {errors.Stock && (
          <span className="error">{errors.Stock.message}</span>
        )}
      </div>

      {/* Category (using setValue for select) */}
      <div className="field">
        <label>{product.Category.label}</label>
        <select
          value={watch(product.Category.id) || ""}
          onChange={(e) => setValue(product.Category.id, e.target.value)}
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

## File & Image Attachments in Forms

Image and File fields get attachment methods on the `item` accessor automatically.
`upload()` updates local field state only — the form's `handleSubmit` persists everything to the backend.
`deleteAttachment()` is atomic — it removes the file from storage and the backend record immediately.

```tsx
// Assuming SellerProduct BDO has:
//   readonly ProductImage = new ImageField({ _id: "ProductImage", Name: "Product Image", Type: "Image" });
//   readonly Attachments = new FileField({ _id: "Attachments", Name: "Attachments", Type: "File" });

function ProductFormWithAttachments({ productId }: { productId?: string }) {
  const product = useMemo(() => new SellerProduct(), []);

  const { register, handleSubmit, item, errors, isSubmitting, watch } = useForm({
    bdo: product,
    recordId: productId,
    mode: ValidationMode.OnBlur,
  });

  // --- Image field (single file) ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Uploads to storage, sets local value (FileType)
    // Validates extension client-side before uploading
    const metadata = await item.ProductImage.upload(file);
    console.log("Uploaded image:", metadata.FileName);
  };

  const handleImageDelete = async () => {
    // Atomic — deletes from storage + backend immediately
    await item.ProductImage.deleteAttachment();
  };

  const handleImagePreview = async () => {
    // Get a thumbnail URL (backend-generated variant)
    const { DownloadUrl } = await item.ProductImage.getDownloadUrl("thumbnail");
    window.open(DownloadUrl);
  };

  // --- File field (multi-file) ---

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    // Uploads all files in parallel, appends to existing array
    const uploaded = await item.Attachments.upload(files);
    console.log(`Uploaded ${uploaded.length} files`);
  };

  const handleFileDelete = async (attachmentId: string) => {
    // Removes single file from storage + backend + local array
    await item.Attachments.deleteAttachment(attachmentId);
  };

  const handleFileDownload = async (attachmentId: string) => {
    const { DownloadUrl } = await item.Attachments.getDownloadUrl(attachmentId);
    window.open(DownloadUrl);
  };

  // Current field values
  const currentImage = item.ProductImage.get();         // FileType | null
  const currentFiles = item.Attachments.get() ?? [];    // FileType[]

  return (
    <form onSubmit={handleSubmit((data) => console.log("Saved:", data._id))}>
      {/* ... other fields with register() ... */}

      {/* Image field */}
      <div className="field">
        <label>{product.ProductImage.label}</label>
        {currentImage ? (
          <div>
            <span>{currentImage.FileName}</span>
            <button type="button" onClick={handleImagePreview}>Preview</button>
            <button type="button" onClick={handleImageDelete}>Remove</button>
          </div>
        ) : (
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        )}
      </div>

      {/* File field */}
      <div className="field">
        <label>{product.Attachments.label}</label>
        <input type="file" multiple onChange={handleFilesUpload} />
        <ul>
          {currentFiles.map((file) => (
            <li key={file._id}>
              {file.FileName} ({file.Size} bytes)
              <button type="button" onClick={() => handleFileDownload(file._id)}>Download</button>
              <button type="button" onClick={() => handleFileDelete(file._id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

**Key points:**
- `upload()` validates file extensions client-side (throws on unsupported types)
- Image upload replaces the current value; File upload appends to the array
- `getDownloadUrl("thumbnail")` / `getDownloadUrl("preview")` request backend-generated variants
- Readonly Image/File fields only have `getDownloadUrl` — no `upload` or `deleteAttachment`

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

---

## Common Mistakes

### 1. Passing FieldType instead of BDO instance

`useForm` takes a BDO class **instance**, NOT a FieldType. The hook infers all types from the BDO class.

```typescript
// ❌ WRONG — FieldType as generic causes register/watch to return `never`
useForm<ProductFieldType>({ ... });

// ❌ WRONG — passing FieldType as bdo
useForm({ bdo: ProductFieldType });

// ✅ CORRECT — pass a BDO class instance
const product = useMemo(() => new SellerProduct(), []);
useForm({ bdo: product, mode: ValidationMode.OnBlur });
```

### 2. Wrong handleSubmit onSuccess type

```typescript
// ❌ WRONG — these types cause errors
const onSuccess = (data: unknown) => { ... };
const onSuccess = (data: Partial<EditableFieldType>) => { ... };

// ✅ CORRECT — CreateUpdateResponseType = { _id: string }
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
const onSuccess = (data: CreateUpdateResponseType): void => {
  console.log("Saved:", data._id);
};
```

### 3. Using register() for boolean fields

Boolean fields need watch/setValue pattern because HTML checkboxes don't work with register().

```typescript
// ❌ WRONG — register doesn't work correctly with checkboxes
<input type="checkbox" {...register(bdo.IsActive.id)} />

// ✅ CORRECT — use watch + setValue
<Checkbox
  checked={Boolean(watch(bdo.IsActive.id))}
  onCheckedChange={(v) => setValue(bdo.IsActive.id, v as boolean)}
/>
```

### 4. Wrong default values for date fields

```typescript
// ❌ WRONG — empty string causes type errors
defaultValues: { StartDate: "" }

// ✅ CORRECT — use undefined for date fields
defaultValues: { StartDate: undefined }
```
