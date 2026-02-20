# BDO SDK API

Type-safe, role-based data access layer for business objects.

## Imports

```typescript
// BDO class (from generated code)
import { AdminProduct } from "@/bdo/admin/Product";
import type { AdminProductEditableFieldType, AdminProductFieldType } from "@/bdo/admin/Product";

// SDK types
import type { ItemType, SystemFieldsType } from "@ram_28/kf-ai-sdk/bdo/types";
import type { ListOptionsType, CreateUpdateResponseType, DeleteResponseType } from "@ram_28/kf-ai-sdk/api/types";
```

---

## Common Mistakes (READ FIRST)

### 1. Guessing field names instead of reading BDO files

ALWAYS read `src/bdo/{role}/*.ts` BEFORE writing page code. Use EXACT field names from the class.

```typescript
// ❌ WRONG — guessing
bdo.productName  bdo.isActive  bdo.unitPrice

// ✅ CORRECT — exact snake_case from BDO file
bdo.product_name  bdo.is_active  bdo.unit_price
```

### 2. Rendering ItemType fields directly in JSX without `.get()`

`bdo.list()`, `bdo.get()`, `bdo.create()` return `ItemType` — each field is an accessor object, NOT a value.

```tsx
// ❌ WRONG — renders [object Object]
const item = await bdo.get(id);
<span>{item.product_name}</span>

// ✅ CORRECT — call .get()
<span>{item.product_name.get()}</span>
<span>{item.product_name.get() ?? "—"}</span>
```

**Key distinction:** `useTable().rows` are plain objects (access `row.field` directly). `bdo.get()`/`bdo.list()` return ItemType proxies (must call `item.field.get()`).

### 3. Rendering Image/File/Reference values in detail pages

These field types return complex objects from `.get()` — NOT renderable as React children.

```tsx
// ❌ WRONG — FileType/ImageFieldType are objects, not ReactNode
<span>{item.product_image.get()}</span>       // ImageFieldType = FileType | null
<span>{item.attachments.get()}</span>          // FileFieldType = FileType[]
<span>{item.category.get()}</span>             // Reference = { _id, _name, ... }

// ✅ CORRECT — extract the renderable value
// Image: use ImageThumbnail component (NEVER use src="#")
import { ImageThumbnail } from "@/components/ui/image-thumbnail";
<ImageThumbnail boId={bdo.meta._id} instanceId={item._id} fieldId={bdo.product_image.id} value={item.product_image.get()} imgClassName="w-24 h-24 object-cover rounded" />

// Image: if you only need the filename as text
const img = item.product_image.get();
<span>{img ? (img as any).FileName : "No image"}</span>

// File array: use FilePreview component
import { FilePreview } from "@/components/ui/file-preview";
<FilePreview boId={bdo.meta._id} instanceId={item._id} fieldId={bdo.attachments.id} value={item.attachments.get()} />

// Reference: access _name
const ref = item.category.get();
<span>{ref ? (ref as any)._name : "—"}</span>

// Number: format
<span>{(item.unit_price.get() ?? 0).toFixed(2)}</span>

// Boolean: display
<span>{item.is_active.get() ? "Yes" : "No"}</span>
```

### 4. Calling protected methods

Only methods the role has permission for are `public`. Check the BDO file.

```typescript
// ❌ WRONG — if delete is not in the role's BDO class
await bdo.delete(id);  // TS2445: Property 'delete' is protected

// ✅ CORRECT — use api() for methods not on the BDO class
import { api } from "@ram_28/kf-ai-sdk/api";
await api(bdo.meta._id).delete(id);
```

### 5. Not handling `.get()` return type (undefined)

```typescript
// ❌ WRONG — might be undefined
const title: string = item.product_name.get();

// ✅ CORRECT — provide fallback
const title = item.product_name.get() ?? "";
const price = item.unit_price.get() ?? 0;
```

---

## BDO Meta & Fields

```typescript
const product = new AdminProduct();
product.meta._id;     // "BDO_Product" — use as source in useTable, api()
product.meta.name;    // "Product"

// Field getters (all field types)
product.product_name.id        // "product_name" — use in register(), watch(), setValue()
product.product_name.label     // "product_name" — display label
product.product_name.required  // boolean
product.product_name.readOnly  // boolean
product.product_name.defaultValue  // unknown
```

## Field Classes

| Class | Extra Getters | Notes |
|-------|--------------|-------|
| `StringField` | `length` | May have `Constraint.Enum` — see useForm Mistake #3 |
| `NumberField` | `integerPart`, `fractionPart` | |
| `BooleanField` | — | |
| `DateField` | — | Format: YYYY-MM-DD |
| `DateTimeField` | `precision` | Format: YYYY-MM-DDTHH:MM:SS |
| `SelectField` | **`options`**, `fetchOptions()` | `.options` returns `{ value, label }[]` |
| `ReferenceField` | `fetchOptions()`, `referenceBdo` | Value is object `{ _id, _name, ... }` |
| `TextField` | `format` | Long text |
| `UserField` | — | Value: `{ _id, _name }` |
| `ImageField` | — | Value: `FileType \| null` |
| `FileField` | — | Value: `FileType[]` |

**CRITICAL**: Only `SelectField` has `.options` getter. `StringField` with `Constraint.Enum` does NOT.

---

## Methods

All methods are `protected` on `BaseBdo`. Role BDOs selectively expose them as `public`.

```typescript
// Read
const item = await bdo.get(id);            // ItemType — call .get() on fields
const items = await bdo.list(options?);     // ItemType[] — call .get() on fields
const count = await bdo.count(options?);    // number

// Write
const created = await bdo.create(data);    // ItemType
const result = await bdo.update(id, data); // { _id: string }
const deleted = await bdo.delete(id);      // { status: "success" }

// Draft
const draft = await bdo.draft(data);       // { [field]: computed_value }
const draftPatch = await bdo.draftPatch(id, data);
const draftInt = await bdo.draftInteraction(data);  // { _id, ...computed }

// Analytics
const metric = await bdo.metric({ GroupBy: [], Metric: [{ Field: "_id", Type: "Count" }] });
// Access: metric.Data[0]["count__id"]  (key pattern: {type}_{Field})

const pivot = await bdo.pivot({ Row: ["category"], Column: ["status"], Metric: [{ Field: "_id", Type: "Count" }] });
// Access: pivot.Data.RowHeader, pivot.Data.ColumnHeader, pivot.Data.Value[row][col]
```

### ListOptionsType

```typescript
interface ListOptionsType {
  Field?: string[];                        // Specific fields (omit for all)
  Filter?: FilterType;                     // See useFilter docs
  Sort?: Record<string, "ASC" | "DESC">[]; // [{ "field": "ASC" }]
  Page?: number;                           // 1-indexed
  PageSize?: number;                       // Default: 10
}
```

---

## ItemType Accessor Pattern

`get()`, `list()`, `create()` return `ItemType` with Proxy-wrapped field accessors.

```typescript
const item = await bdo.get("id123");

item._id;                  // "id123" — direct access (only _id)
item.product_name.get();   // string | undefined
item.product_name.set("New");  // editable fields only
item.product_name.label;   // "product_name"
item.product_name.required; // boolean
item.toJSON();             // plain object
```

## SystemFieldsType

```typescript
type SystemFieldsType = {
  _id: string;
  _created_at: string;    // "YYYY-MM-DDTHH:MM:SS"
  _modified_at: string;
  _created_by: { _id: string; _name: string };
  _modified_by: { _id: string; _name: string };
  _version: string;
  _m_version: string;
};
```

## API Types

```typescript
interface CreateUpdateResponseType { _id: string; }
interface DeleteResponseType { status: "success"; }
interface FileType { _id: string; _name: string; FileName: string; FileExtension: string; Size: number; ContentType: string; }
type ImageFieldType = FileType | null;
type FileFieldType = FileType[];
type AggregationType = "Sum" | "Avg" | "Count" | "Max" | "Min" | "DistinctCount" | "BlankCount" | "NotBlankCount" | "Concat" | "DistinctConcat";
```
