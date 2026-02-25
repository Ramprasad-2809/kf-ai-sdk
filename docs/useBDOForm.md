# useBDOForm

React hook for BDO forms with validation, API integration, and typed field handling.

## Imports

```typescript
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import { ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type { UseBDOFormOptionsType, UseBDOFormReturnType, FormItemType, FormRegisterType, HandleSubmitType } from "@ram_28/kf-ai-sdk/form/types";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";

// Pre-built components for special field types
import { ReferenceSelect } from "@/components/system/reference-select";
import { ImageUpload } from "@/components/system/image-upload";
import { FileUpload } from "@/components/system/file-upload";
// Display components (for detail/view pages, NOT forms)
import { ImageThumbnail } from "@/components/system/image-thumbnail";
import { FilePreview } from "@/components/system/file-preview";
```

---

## Common Mistakes (READ FIRST)

### 1. Missing `operation` in useBDOForm options (TS2345)

ALWAYS include `operation`. Without it, TypeScript cannot resolve the union type.

```typescript
// ❌ WRONG — missing operation (TS2345)
useBDOForm({ bdo: product, mode: ValidationMode.OnBlur });

// ✅ CORRECT — always include operation
useBDOForm({ bdo: product, operation: FormOperation.Create, mode: ValidationMode.OnBlur });
useBDOForm({ bdo: product, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur });
```

### 2. Annotating ternary with UseBDOFormOptionsType (TS2322)

`UseBDOFormOptionsType` is a discriminated union. Type-annotating a variable prevents TS narrowing. NEVER annotate — call useBDOForm inline in each branch.

```typescript
// ❌ WRONG — type annotation prevents union narrowing (TS2322)
const options: UseBDOFormOptionsType<typeof bdo> = id
  ? { bdo, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur }
  : { bdo, operation: FormOperation.Create, mode: ValidationMode.OnBlur };
const formResult = useBDOForm(options);

// ✅ CORRECT — call useBDOForm inline, no type annotation
const formResult = id
  ? useBDOForm({ bdo, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur })
  : useBDOForm({ bdo, operation: FormOperation.Create, mode: ValidationMode.OnBlur });
const { register, handleSubmit, watch, setValue, item, formState: { errors, isSubmitting }, isLoading } = formResult;
```

### 3. Using `.options` on StringField (TS2339)

ONLY `SelectField` has `.options` getter. `StringField` with `Constraint.Enum` does NOT — use hardcoded `<option>` values from the BDO file.

```tsx
// Check the BDO class to determine field type:
// new SelectField({...}) → has .options     → use bdo.field.options.map()
// new StringField({..."Constraint": {"Enum": [...]}}) → NO .options → hardcode from Enum array

// ❌ WRONG — StringField has no .options (TS2339)
// Given: readonly status = new StringField({... "Constraint": { "Enum": ["Active", "Discontinued"] }})
<select {...register(bdo.status.id)}>
  {bdo.status.options.map((opt) => (          // TS2339: Property 'options' does not exist on StringField
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>

// ✅ CORRECT for StringField with Enum — hardcode options from BDO Constraint.Enum array
<select {...register(bdo.status.id)}>
  <option value="">Select {bdo.status.label}</option>
  <option value="Active">Active</option>
  <option value="Discontinued">Discontinued</option>
</select>

// ✅ CORRECT for SelectField — use .options getter
// Given: readonly status = new SelectField({...})
<select {...register(bdo.status.id)}>
  <option value="">Select {bdo.status.label}</option>
  {bdo.status.options.map((opt) => (
    <option key={opt.value} value={opt.value}>{opt.label}</option>
  ))}
</select>
```

### 4. Using register() for BooleanField

HTML checkboxes don't work with register(). Use watch/setValue.

```tsx
// ❌ WRONG
<input type="checkbox" {...register(bdo.is_active.id)} />

// ✅ CORRECT
<Checkbox
  checked={Boolean(watch(bdo.is_active.id))}
  onCheckedChange={(v) => setValue(bdo.is_active.id, v as boolean, { shouldDirty: true })}
/>
```

### 5. Using `<input>` for ReferenceField (should use `<ReferenceSelect>`)

ReferenceField stores an object `{ _id, _name, ... }`, not a string. Use the pre-built component.

```tsx
// ❌ WRONG — text input for reference field
<input {...register(bdo.category.id)} />

// ✅ CORRECT
<ReferenceSelect
  bdoField={bdo.category}
  instanceId={id || String(watch("_id") ?? "")}
  value={watch(bdo.category.id)}
  onChange={(val) => setValue(bdo.category.id, val, { shouldDirty: true })}
/>
```

### 6. Using custom Image/File upload (should use template components)

Use `<ImageUpload>` and `<FileUpload>`. CRITICAL: `instanceId` must work for BOTH edit and create mode.

```tsx
// ❌ WRONG — instanceId={id} is undefined in create mode
<ImageUpload field={item.icon} value={watch(bdo.icon.id)} boId={bdo.meta._id} instanceId={id} fieldId={bdo.icon.id} />

// ✅ CORRECT — ImageUpload (single image)
<ImageUpload
  field={item.product_image}
  value={watch(bdo.product_image.id)}
  boId={bdo.meta._id}
  instanceId={id || String(watch("_id") ?? "")}
  fieldId={bdo.product_image.id}
/>

// ✅ CORRECT — FileUpload (multi-file)
<FileUpload
  field={item.specification_document}
  value={watch(bdo.specification_document.id)}
  boId={bdo.meta._id}
  instanceId={id || String(watch("_id") ?? "")}
  fieldId={bdo.specification_document.id}
/>
```

Props: `field` = item accessor (`item.fieldName`), `value` = `watch(bdo.field.id)`, `boId` = `bdo.meta._id`, `instanceId` = `id || String(watch("_id") ?? "")`, `fieldId` = `bdo.field.id`. Parent component MUST have `"use no memo"` directive.

### 7. Wrong handleSubmit onSuccess type

```typescript
// ❌ WRONG
const onSuccess = (data: unknown) => { ... };

// ✅ CORRECT — CreateUpdateResponseType = { _id: string }
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
const onSuccess = (data: CreateUpdateResponseType) => { toast.success("Saved"); navigate("/list"); };
```

### 8. Passing FieldType instead of BDO instance

```typescript
// ❌ WRONG
useBDOForm<ProductFieldType>({ ... });

// ✅ CORRECT — pass BDO class instance
const product = useMemo(() => new SellerProduct(), []);
useBDOForm({ bdo: product, operation: FormOperation.Create, mode: ValidationMode.OnBlur });
```

### 9. Wrong default values for date fields

```typescript
// ❌ WRONG — empty string causes type errors
defaultValues: { start_date: "" }

// ✅ CORRECT
defaultValues: { start_date: undefined }
```


### 10. Comparing `item.field` to a string literal (TS2367)

`item.field` returns an accessor proxy (`EditableFieldAccessorType`), NOT a raw string. Use `.get()` to extract the value.

```tsx
// ❌ WRONG — item.status is a proxy, not a string (TS2367: no overlap)
if (item.status === "Active") { ... }
if (item.order_status === "Shipped") { ... }

// ✅ CORRECT — use .get() to extract the raw value
if (item.status.get() === "Active") { ... }
if (item.order_status.getOrDefault("Pending") === "Shipped") { ... }

// ✅ ALSO CORRECT — use watch() for the raw value
const statusVal = watch(bdo.status.id);
if (statusVal === "Active") { ... }
```

**Applies to ALL conditional rendering based on field values:**
```tsx
// ❌ WRONG — TS2367
{item.category === "Electronics" && <ElectronicsFields />}

// ✅ CORRECT
{watch(bdo.category.id) === "Electronics" && <ElectronicsFields />}
// or
{item.category.get() === "Electronics" && <ElectronicsFields />}
```

### 11. Passing `form.watch()` to useEffect dependency array

`watch()` creates a new reference each render — putting it directly in deps causes infinite re-renders.

```tsx
// ❌ WRONG — watch() in deps triggers infinite loop
useEffect(() => {
  // side effect using field value
}, [form.watch(bdo.status.id)]);

// ✅ CORRECT — store watch result in a variable first
const statusVal = form.watch(bdo.status.id);
useEffect(() => {
  // side effect using statusVal
}, [statusVal]);
```

### 12. Using string literals instead of `field.id` in watch/setValue (TS2322)

`watch()` and `setValue()` expect the field name union type from the BDO class. Plain strings don't match.

```tsx
// ❌ WRONG — plain string doesn't match field name union type (TS2322)
watch("tier");
setValue("tier", value);

// ✅ CORRECT — use bdo.field.id
watch(bdo.tier.id);
setValue(bdo.tier.id, value, { shouldDirty: true });
```


### 13. Using `field` prop on display components (TS2322)

Display components (`ImageThumbnail`, `FilePreview`) take individual string props. Form components (`ImageUpload`, `FileUpload`) take a `field` accessor. NEVER mix them up.

```tsx
// ❌ WRONG — ImageThumbnail does NOT accept field prop (TS2322)
<ImageThumbnail field={item.product_image} value={watch(bdo.product_image.id)} />

// ✅ CORRECT — ImageThumbnail uses individual props (for detail/view/table pages)
<ImageThumbnail
  boId={bdo.meta._id}
  instanceId={id}
  fieldId={bdo.product_image.id}
  value={watch(bdo.product_image.id)}
/>

// ❌ WRONG — FilePreview does NOT accept field prop (TS2322)
<FilePreview field={item.specification_document} value={watch(bdo.specification_document.id)} />

// ✅ CORRECT — FilePreview uses individual props (for detail/view/table pages)
<FilePreview
  boId={bdo.meta._id}
  instanceId={id}
  fieldId={bdo.specification_document.id}
  value={watch(bdo.specification_document.id)}
/>

// ✅ CORRECT — ImageUpload uses field accessor (for form/edit pages)
<ImageUpload
  field={item.product_image}
  value={watch(bdo.product_image.id)}
  boId={bdo.meta._id}
  instanceId={id || String(watch("_id") ?? "")}
  fieldId={bdo.product_image.id}
/>
```

**Rule of thumb:**
- **Form page (create/edit)**: `ImageUpload` / `FileUpload` with `field={item.fieldname}`
- **Display page (detail/view/table)**: `ImageThumbnail` / `FilePreview` with `boId, instanceId, fieldId, value`

### 14. Wrong handleSubmit onError type (TS2345)

`handleSubmit(onSuccess, onError)` — the `onError` callback receives `FieldErrors | Error`, NOT just `Error`.

```typescript
// ❌ WRONG — Error alone is not assignable (TS2345)
const onError = (error: Error) => { toast.error(error.message); };

// ✅ CORRECT — import FieldErrors from react-hook-form
import type { FieldErrors } from "react-hook-form";
const onError = (error: FieldErrors | Error) => {
  toast.error(error instanceof Error ? error.message : "Please fix errors above");
};
```

---

## Complete Form Example (Create + Edit)

```tsx
"use no memo";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBDOForm, ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
import type { FieldErrors } from "react-hook-form";
import { AdminProduct } from "@/bdo/admin/Product";
import { ReferenceSelect } from "@/components/system/reference-select";
import { ImageUpload } from "@/components/system/image-upload";
import { FileUpload } from "@/components/system/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bdo = useMemo(() => new AdminProduct(), []);

  // Create/Edit ternary — NO type annotation on result
  const formResult = id
    ? useBDOForm({ bdo, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur })
    : useBDOForm({ bdo, operation: FormOperation.Create, mode: ValidationMode.OnBlur });

  const { register, handleSubmit, watch, setValue, item, formState: { errors, isSubmitting }, isLoading } = formResult;

  // Loading guard AFTER all hooks
  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const onSuccess = (data: CreateUpdateResponseType) => {
    toast.success(id ? "Updated" : "Created");
    navigate("/products");
  };

  const onError = (error: FieldErrors | Error) => {
    toast.error(error instanceof Error ? error.message : "Please fix errors above");
  };

  return (
    <form onSubmit={handleSubmit(onSuccess, onError)} className="space-y-6">
      {/* StringField — register */}
      <div>
        <label>{bdo.product_name.label}{bdo.product_name.required && <span className="text-red-500"> *</span>}</label>
        <input {...register(bdo.product_name.id)} className="w-full border rounded px-3 py-2" />
        {errors.product_name && <p className="text-red-600 text-sm">{errors.product_name.message}</p>}
      </div>

      {/* NumberField — register */}
      <div>
        <label>{bdo.unit_price.label}</label>
        <input type="number" step="0.01" {...register(bdo.unit_price.id)} className="w-full border rounded px-3 py-2" />
        {errors.unit_price && <p className="text-red-600 text-sm">{errors.unit_price.message}</p>}
      </div>

      {/* StringField with Constraint.Enum — hardcoded options (NO .options getter) */}
      <div>
        <label>{bdo.status.label}</label>
        <select {...register(bdo.status.id)} className="w-full border rounded px-3 py-2">
          <option value="">Select {bdo.status.label}</option>
          <option value="Active">Active</option>
          <option value="Discontinued">Discontinued</option>
        </select>
        {errors.status && <p className="text-red-600 text-sm">{errors.status.message}</p>}
      </div>

      {/* ReferenceField — ReferenceSelect component */}
      <div>
        <label>{bdo.category.label}</label>
        <ReferenceSelect
          bdoField={bdo.category}
          instanceId={id || String(watch("_id") ?? "")}
          value={watch(bdo.category.id)}
          onChange={(val) => setValue(bdo.category.id, val, { shouldDirty: true })}
        />
        {errors.category && <p className="text-red-600 text-sm">{String(errors.category.message ?? "")}</p>}
      </div>

      {/* BooleanField — watch + setValue */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={Boolean(watch(bdo.is_active.id))}
          onCheckedChange={(v) => setValue(bdo.is_active.id, v as boolean, { shouldDirty: true })}
        />
        <label>{bdo.is_active.label}</label>
      </div>

      {/* ImageField — ImageUpload component */}
      <div>
        <label>{bdo.product_image.label}</label>
        <ImageUpload
          field={item.product_image}
          value={watch(bdo.product_image.id)}
          boId={bdo.meta._id}
          instanceId={id || String(watch("_id") ?? "")}
          fieldId={bdo.product_image.id}
        />
      </div>

      {/* FileField — FileUpload component */}
      <div>
        <label>{bdo.specification_document.label}</label>
        <FileUpload
          field={item.specification_document}
          value={watch(bdo.specification_document.id)}
          boId={bdo.meta._id}
          instanceId={id || String(watch("_id") ?? "")}
          fieldId={bdo.specification_document.id}
        />
      </div>

      {/* TextField — textarea with register */}
      <div>
        <label>{bdo.description.label}</label>
        <textarea {...register(bdo.description.id)} rows={4} className="w-full border rounded px-3 py-2" />
      </div>

      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary text-white rounded">
        {isSubmitting ? "Saving..." : id ? "Update" : "Create"}
      </button>
    </form>
  );
}
```

---

## Type Definitions

### UseBDOFormOptionsType (Discriminated Union)

```typescript
type UseBDOFormOptionsType<B extends BaseBdo<any, any, any>> =
  | { bdo: B; operation: "create"; defaultValues?: Partial<EditableFieldType>; mode?: ValidationModeType; }
  | { bdo: B; operation: "update"; recordId: string; mode?: ValidationModeType; }
  | { bdo: B; recordId?: string; defaultValues?: Partial<EditableFieldType>; mode?: ValidationModeType; };
```

### UseBDOFormReturnType

```typescript
interface UseBDOFormReturnType<B> {
  item: FormItemType<EditableFieldType, ReadonlyFieldType>;  // Field accessors (.get(), .set(), .upload())
  register: FormRegisterType;       // Auto-disables readonly fields
  handleSubmit: HandleSubmitType;   // Auto-calls bdo.create() or bdo.update()
  watch: UseFormWatch;              // Watch field values by bdo.field.id
  setValue: UseFormSetValue;        // Set field values by bdo.field.id
  getValues: UseFormGetValues;
  control: Control;
  formState: FormState;
  errors: FieldErrors;
  isLoading: boolean;               // Fetching record data (edit mode)
  isSubmitting: boolean;
  isDirty: boolean;
  loadError: Error | null;
}
```

### File & Image Types

```typescript
interface FileType { _id: string; _name: string; FileName: string; FileExtension: string; Size: number; ContentType: string; }
type ImageFieldType = FileType | null;   // Single image, nullable
type FileFieldType = FileType[];          // Array of files
```

Image accessor: `item.field.get()` returns `FileType | null`. Has `upload(file: File)`, `deleteAttachment()`, `getDownloadUrl()`.
File accessor: `item.field.get()` returns `FileType[]`. Has `upload(files: File[])`, `deleteAttachment(id)`, `getDownloadUrl(id)`.

### Constants

```typescript
FormOperation.Create  // "create"
FormOperation.Update  // "update"
ValidationMode.OnBlur / .OnChange / .OnSubmit / .OnTouched / .All
```

### Field-Type to UI Component Mapping

| BDO Field Class | UI Pattern |
|---|---|
| `StringField` | `<input {...register(bdo.field.id)} />` |
| `StringField` with `Constraint.Enum` | `<select {...register(bdo.field.id)}>` with hardcoded `<option>` from Enum array |
| `SelectField` | `<select {...register(bdo.field.id)}>` with `bdo.field.options.map()` |
| `TextField` | `<textarea {...register(bdo.field.id)} />` |
| `NumberField` | `<input type="number" {...register(bdo.field.id)} />` |
| `BooleanField` | `<Checkbox checked={watch()} onCheckedChange={v => setValue()} />` |
| `DateField` | `<input type="date" {...register(bdo.field.id)} />` |
| `DateTimeField` | `<input type="datetime-local" {...register(bdo.field.id)} />` |
| `ReferenceField` | `<ReferenceSelect bdoField={bdo.field} instanceId={id \|\| String(watch("_id") ?? "")} value={watch()} onChange={...} />` |
| `UserField` | `<ReferenceSelect bdoField={bdo.field} instanceId={id \|\| String(watch("_id") ?? "")} value={watch()} onChange={...} />` |
| `ImageField` | `<ImageUpload field={item.field} value={watch()} boId={} instanceId={} fieldId={} />` |
| `FileField` | `<FileUpload field={item.field} value={watch()} boId={} instanceId={} fieldId={} />` |
