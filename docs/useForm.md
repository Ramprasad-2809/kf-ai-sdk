# Form SDK API

React hook for forms with validation, API integration, and typed field handling.

## Imports

```typescript
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type { UseFormOptionsType, UseFormReturnType, FormItemType, FormRegisterType, HandleSubmitType } from "@ram_28/kf-ai-sdk/form/types";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";

// Pre-built components for special field types
import { ReferenceSelect } from "@/components/ui/reference-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { FileUpload } from "@/components/ui/file-upload";
```

---

## Common Mistakes (READ FIRST)

### 1. Missing `operation` in useForm options (TS2345)

ALWAYS include `operation`. Without it, TypeScript cannot resolve the union type.

```typescript
// ❌ WRONG — missing operation (TS2345)
useForm({ bdo: product, mode: ValidationMode.OnBlur });

// ✅ CORRECT — always include operation
useForm({ bdo: product, operation: FormOperation.Create, mode: ValidationMode.OnBlur });
useForm({ bdo: product, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur });
```

### 2. Annotating ternary with UseFormOptionsType (TS2322)

`UseFormOptionsType` is a discriminated union. Type-annotating a variable prevents TS narrowing. NEVER annotate — call useForm inline in each branch.

```typescript
// ❌ WRONG — type annotation prevents union narrowing (TS2322)
const options: UseFormOptionsType<typeof bdo> = id
  ? { bdo, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur }
  : { bdo, operation: FormOperation.Create, mode: ValidationMode.OnBlur };
const formResult = useForm(options);

// ✅ CORRECT — call useForm inline, no type annotation
const formResult = id
  ? useForm({ bdo, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur })
  : useForm({ bdo, operation: FormOperation.Create, mode: ValidationMode.OnBlur });
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
useForm<ProductFieldType>({ ... });

// ✅ CORRECT — pass BDO class instance
const product = useMemo(() => new SellerProduct(), []);
useForm({ bdo: product, operation: FormOperation.Create, mode: ValidationMode.OnBlur });
```

### 9. Wrong default values for date fields

```typescript
// ❌ WRONG — empty string causes type errors
defaultValues: { start_date: "" }

// ✅ CORRECT
defaultValues: { start_date: undefined }
```

---

## Complete Form Example (Create + Edit)

```tsx
"use no memo";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, ValidationMode, FormOperation } from "@ram_28/kf-ai-sdk/form";
import type { CreateUpdateResponseType } from "@ram_28/kf-ai-sdk/api/types";
import { AdminProduct } from "@/bdo/admin/Product";
import { ReferenceSelect } from "@/components/ui/reference-select";
import { ImageUpload } from "@/components/ui/image-upload";
import { FileUpload } from "@/components/ui/file-upload";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const bdo = useMemo(() => new AdminProduct(), []);

  // Create/Edit ternary — NO type annotation on result
  const formResult = id
    ? useForm({ bdo, operation: FormOperation.Update, recordId: id, mode: ValidationMode.OnBlur })
    : useForm({ bdo, operation: FormOperation.Create, mode: ValidationMode.OnBlur });

  const { register, handleSubmit, watch, setValue, item, formState: { errors, isSubmitting }, isLoading } = formResult;

  // Loading guard AFTER all hooks
  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const onSuccess = (data: CreateUpdateResponseType) => {
    toast.success(id ? "Updated" : "Created");
    navigate("/products");
  };

  const onError = (error: any) => {
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

### UseFormOptionsType (Discriminated Union)

```typescript
type UseFormOptionsType<B extends BaseBdo<any, any, any>> =
  | { bdo: B; operation: "create"; defaultValues?: Partial<EditableFieldType>; mode?: ValidationModeType; }
  | { bdo: B; operation: "update"; recordId: string; mode?: ValidationModeType; }
  | { bdo: B; recordId?: string; defaultValues?: Partial<EditableFieldType>; mode?: ValidationModeType; };
```

### UseFormReturnType

```typescript
interface UseFormReturnType<B> {
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
| `ReferenceField` | `<ReferenceSelect bdoField={bdo.field} value={watch()} onChange={...} />` |
| `ImageField` | `<ImageUpload field={item.field} value={watch()} boId={} instanceId={} fieldId={} />` |
| `FileField` | `<FileUpload field={item.field} value={watch()} boId={} instanceId={} fieldId={} />` |
