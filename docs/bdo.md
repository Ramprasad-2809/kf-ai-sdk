# BDO SDK API

Type-safe, role-based data access layer for business objects.

## Imports

```typescript
// BDO class (from your generated code)
import { AdminProduct } from "../bdo/admin/Product";

// Field types (from your generated code)
import type {
  AdminProductEditableFieldType,
  AdminProductReadonlyFieldType,
  AdminProductFieldType,
} from "../bdo/admin/Product";

// SDK types
import type {
  ItemType,
  BdoMetaType,
  ValidationResultType,
  SelectOptionType,
  EditableFieldAccessorType,
  ReadonlyFieldAccessorType,
  BaseFieldMetaType,
} from "@ram_28/kf-ai-sdk/bdo/types";

// System fields
import type { SystemFieldsType } from "@ram_28/kf-ai-sdk/bdo/types";

// API types (for method params/responses)
import type {
  ListOptionsType,
  CreateUpdateResponseType,
  DeleteResponseType,
  DraftResponseType,
  MetricOptionsType,
  MetricResponseType,
  PivotOptionsType,
  PivotResponseType,
} from "@ram_28/kf-ai-sdk/api/types";
```

## BDO Meta

Every BDO has a `meta` property identifying the business object.

```typescript
const product = new AdminProduct();

product.meta._id;   // "BDO_Product"
product.meta.name;  // "Product"
```

Use `meta._id` anywhere a source identifier is needed (e.g., `useTable`, `useFilter`).

---

## Field Definitions

Fields are readonly properties on the BDO class, constructed with raw backend meta JSON.

```typescript
// In the generated BDO class
readonly Title = new StringField({
  _id: "Title",
  Name: "Product Title",
  Type: "String",
  Constraint: { Required: true, Length: 255 },
});
```

### BaseField Getters

Every field exposes these getters:

| Getter | Type | Source |
|--------|------|--------|
| `field.id` | `string` | `_meta._id` |
| `field.label` | `string` | `_meta.Name` |
| `field.readOnly` | `boolean` | `_meta.ReadOnly` |
| `field.required` | `boolean` | `_meta.Constraint.Required` or `_meta.Required` |
| `field.defaultValue` | `unknown` | `_meta.DefaultValue` or `_meta.Constraint.DefaultValue` |
| `field.primaryKey` | `boolean` | `_meta.Constraint.PrimaryKey` |
| `field.meta` | `BaseFieldMetaType` | Full raw backend meta object |

### Usage

```typescript
const product = new AdminProduct();

// react-hook-form register
register(product.Title.id);

// UI labels
<label>{product.Title.label}</label>

// Required indicator
{product.Title.required && <span>*</span>}

// Filter by field
const items = await product.list({
  Filter: {
    Operator: "And",
    Condition: [{
      LHSField: product.Price.id,
      Operator: "GT",
      RHSValue: 50,
      RHSType: "Constant",
    }],
  },
});
```

---

## Methods

All `BaseBdo` methods are `protected`. Role BDOs selectively re-expose them as `public` based on permissions. For full request/response type definitions, see [api.md](api.md).

### get

Fetches a single record by ID.

```typescript
async get(id: string): Promise<ItemType<TEditable, TReadonly>>
```

Returns an [ItemType](#itemtype--runtime-accessor-pattern) with field accessors.

```typescript
const item = await product.get("prod_abc123");

console.log(item._id);           // "prod_abc123"
console.log(item.Title.get());   // "Wireless Headphones"
console.log(item.Title.label);   // "Product Title"
```

---

### list

Fetches paginated records with optional filtering, sorting, and pagination.

```typescript
async list(options?: ListOptionsType): Promise<ItemType<TEditable, TReadonly>[]>
```

Returns an array of [ItemType](#itemtype--runtime-accessor-pattern).

```typescript
const items = await product.list({
  Filter: {
    Operator: "And",
    Condition: [{
      LHSField: product.Category.id,
      Operator: "EQ",
      RHSValue: "Electronics",
      RHSType: "Constant",
    }],
  },
  Sort: [{ [product.Price.id]: "ASC" }],
  Page: 1,
  PageSize: 20,
});

items.forEach((item) => {
  console.log(item.Title.get(), item.Price.get());
});
```

---

### count

Returns the count of records matching filter criteria.

```typescript
async count(options?: ListOptionsType): Promise<number>
```

Uses the same `ListOptionsType` for filtering. Returns the count directly as a `number`.

```typescript
const total = await product.count();
console.log(`Total products: ${total}`);

// With filter
const lowStock = await product.count({
  Filter: {
    Operator: "And",
    Condition: [{
      LHSField: product.Stock.id,
      Operator: "LT",
      RHSValue: 10,
      RHSType: "Constant",
    }],
  },
});
```

---

### create

Creates a new record.

```typescript
async create(data: Partial<TEditable>): Promise<ItemType<TEditable, TReadonly>>
```

Returns an [ItemType](#itemtype--runtime-accessor-pattern) with the new `_id` from the API response and the input data as field accessors.

```typescript
const newItem = await product.create({
  Title: "Wireless Headphones",
  Price: 99.99,
  Category: "Electronics",
});

console.log(newItem._id);          // New record ID
console.log(newItem.Title.get());  // "Wireless Headphones"
```

---

### update

Updates an existing record.

```typescript
async update(id: string, data: Partial<TEditable>): Promise<CreateUpdateResponseType>
```

Returns `{ _id: string }`.

```typescript
const result = await product.update("prod_abc123", {
  Price: 79.99,
  Stock: 45,
});

console.log("Updated:", result._id);
```

---

### delete

Deletes a record by ID.

```typescript
async delete(id: string): Promise<DeleteResponseType>
```

Returns `{ status: "success" }`.

```typescript
const result = await product.delete("prod_abc123");

if (result.status === "success") {
  console.log("Deleted successfully");
}
```

---

### draft

Previews computed field values for a new record without saving.

```typescript
async draft(data: Partial<TEditable>): Promise<DraftResponseType>
```

Returns computed field values as `{ [fieldName: string]: any }`.

```typescript
const draftResult = await product.draft({
  Price: 100,
  DiscountPercent: 15,
});

console.log("Computed discount:", draftResult.DiscountAmount);
console.log("Computed final price:", draftResult.FinalPrice);
```

---

### draftPatch

Previews computed field values for an existing record being edited.

```typescript
async draftPatch(id: string, data: Partial<TEditable>): Promise<DraftResponseType>
```

```typescript
const draftResult = await product.draftPatch("prod_abc123", {
  Price: 120,
  DiscountPercent: 20,
});

console.log("Updated discount:", draftResult.DiscountAmount);
```

---

### draftInteraction

Creates/updates a draft without requiring an instance ID. Returns computed fields along with a temporary `_id`.

```typescript
async draftInteraction(data: Partial<TEditable>): Promise<DraftResponseType & { _id: string }>
```

```typescript
const result = await product.draftInteraction({
  Price: 100,
  DiscountPercent: 10,
});

console.log(result._id);              // Temporary draft ID
console.log(result.DiscountAmount);    // Computed value
```

---

### createItem

Creates an `ItemType` wrapper synchronously (no API call). Useful for creating an empty item for form binding.

```typescript
createItem(data?: Partial<TEditable>): ItemType<TEditable, TReadonly>
```

```typescript
const emptyItem = product.createItem();
emptyItem.Title.set("Draft Product");
emptyItem.Price.set(0);

const validation = emptyItem.validate();
console.log(validation.valid);   // false (required fields missing)
```

---

### metric

Performs aggregation queries on records.

```typescript
async metric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>
```

The `Type` field is added internally. Pass only `GroupBy`, `Metric`, and optional `Filter`.

```typescript
// Total count
const response = await product.metric({
  GroupBy: [],
  Metric: [{ Field: "_id", Type: "Count" }],
});
console.log("Total:", response.Data[0]["count__id"]);

// Group by category with multiple metrics
const byCategory = await product.metric({
  GroupBy: ["Category"],
  Metric: [
    { Field: "Stock", Type: "Sum" },
    { Field: "Price", Type: "Avg" },
  ],
});
byCategory.Data.forEach((row) => {
  console.log(`${row.Category}: ${row["sum_Stock"]} stock, $${row["avg_Price"]} avg`);
});
```

---

### pivot

Creates pivot table aggregations with row and column dimensions.

```typescript
async pivot(options: Omit<PivotOptionsType, "Type">): Promise<PivotResponseType>
```

The `Type` field is added internally. Pass only `Row`, `Column`, `Metric`, and optional `Filter`.

```typescript
const response = await product.pivot({
  Row: ["Category"],
  Column: ["Region"],
  Metric: [{ Field: "Stock", Type: "Sum" }],
});

const { RowHeader, ColumnHeader, Value } = response.Data;

RowHeader.forEach((row, ri) => {
  ColumnHeader.forEach((col, ci) => {
    console.log(`${row.Key} - ${col.Key}: ${Value[ri][ci]}`);
  });
});
```

---

## Field Classes

All field classes extend `BaseField<T>` and accept raw backend meta JSON as the constructor parameter.

| Class | Backend Type | Extra Getters |
|-------|-------------|---------------|
| `StringField` | `"String"` | `length` |
| `NumberField` | `"Number"` | `integerPart`, `fractionPart` |
| `BooleanField` | `"Boolean"` | — |
| `DateField` | `"Date"` | — |
| `DateTimeField` | `"DateTime"` | `precision` |
| `SelectField<T>` | `"String"` | `options`, `fetchOptions()` |
| `ReferenceField<T>` | `"Reference"` | `referenceBdo`, `referenceFields`, `searchFields`, `fetchOptions()` |
| `TextField` | `"Text"` | `format` |
| `UserField` | `"User"` | `businessEntity` |
| `FileField` | `"File"` | — |
| `ArrayField<T>` | `"Array"` | `elementType` |
| `ObjectField<T>` | `"Object"` | `properties` |

### SelectField

Options from `Constraint.Enum` are available synchronously via the `options` getter:

```typescript
product.Status.options;
// [{ value: "active", label: "active" }, { value: "inactive", label: "inactive" }]
```

Dynamic options can be fetched from the backend via `fetchOptions()`:

```typescript
async fetchOptions(instanceId?: string): Promise<SelectOptionType<T>[]>
```

```typescript
const statusOptions = await product.Status.fetchOptions();
// [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]
```

### ReferenceField

Reference configuration is derived from `View.DataObject` in the raw meta:

```typescript
product.SupplierInfo.referenceBdo;     // "BDO_Supplier"
product.SupplierInfo.referenceFields;  // ["_id", "SupplierName", "Email"]
product.SupplierInfo.searchFields;     // ["SupplierName"]
```

Referenced records can be fetched via `fetchOptions()`:

```typescript
async fetchOptions(instanceId?: string): Promise<TRef[]>
```

```typescript
const suppliers = await product.SupplierInfo.fetchOptions();
// [{ _id: "sup_1", SupplierName: "Acme Corp", Email: "contact@acme.com" }, ...]
```

---

## ItemType — Runtime Accessor Pattern

`ItemType<TEditable, TReadonly>` is what `get()`, `list()`, `create()`, and `createItem()` return. It wraps API response data with a Proxy, providing field accessors for every field.

### Field Accessor Access

```typescript
const item = await product.get("prod_abc123");

// Get value (NOT direct access — always use .get())
item.Title.get();          // "Wireless Headphones"

// Field metadata
item.Title.label;          // "Product Title"
item.Title.required;       // true
item.Title.readOnly;       // false
item.Title.defaultValue;   // undefined
item.Title.meta;           // full raw backend meta (BaseFieldMetaType)

// Set value (only on editable fields)
item.Title.set("New Title");

// Validate (type + expression rules)
const result = item.Title.validate();
// { valid: true, errors: [] }
```

### Direct `_id` Access

`_id` is the only field accessed directly (not as an accessor):

```typescript
item._id;  // "prod_abc123"
```

### Editable vs Readonly Accessors

Fields in `TEditable` get a `set()` method. Fields in `TReadonly` do not.

**Editable field accessor:**

```typescript
{
  label: string,
  required: boolean,
  readOnly: false,          // always false for editable
  defaultValue: unknown,
  meta: BaseFieldMetaType,
  get(): T | undefined,
  set(value: T): void,      // only on editable fields
  validate(): ValidationResultType,
}
```

**Readonly field accessor:**

```typescript
{
  label: string,
  required: boolean,
  readOnly: true,            // always true for readonly
  defaultValue: unknown,
  meta: BaseFieldMetaType,
  get(): T | undefined,
  validate(): ValidationResultType,
  // no set()
}
```

### Item Methods

```typescript
// Validate all non-readonly fields
item.validate();
// { valid: boolean, errors: string[] }

// Convert to plain object
item.toJSON();
// Partial<T> — raw data without accessors
```

---

## Type Definitions

### BdoMetaType

```typescript
interface BdoMetaType {
  readonly _id: string;   // Business object ID (e.g., "BDO_Product")
  readonly name: string;  // Display name (e.g., "Product")
}
```

### ValidationResultType

```typescript
interface ValidationResultType {
  valid: boolean;
  errors: string[];
}
```

### SelectOptionType

```typescript
interface SelectOptionType<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
```

### SystemFieldsType

```typescript
type SystemFieldsType = {
  _id: string;
  _created_at: DateTimeFieldType;
  _modified_at: DateTimeFieldType;
  _created_by: UserFieldType;     // { _id: string; _name: string }
  _modified_by: UserFieldType;
  _version: string;
  _m_version: string;
};

// Union of system field names (for Omit<> operations)
type SystemFields = keyof SystemFieldsType;
```

### BaseFieldMetaType

The raw backend meta shape stored by every field:

```typescript
interface BaseFieldMetaType {
  _id: string;           // Field identifier
  Name: string;          // Display name
  Type: string;          // Field type ("String", "Number", "Reference", etc.)
  ReadOnly?: boolean;
  Required?: boolean;
  Constraint?: BaseConstraintType;
  DefaultValue?: unknown;
}
```

### BaseConstraintType

```typescript
interface BaseConstraintType {
  Required?: boolean;
  PrimaryKey?: boolean;
  DefaultValue?: unknown;
}
```

### EditableFieldAccessorType

```typescript
interface EditableFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResultType;
}
```

### ReadonlyFieldAccessorType

```typescript
type ReadonlyFieldAccessorType<T> = {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  validate(): ValidationResultType;
};
```

---

## Complete Example

```typescript
import { AdminProduct } from "../bdo/admin/Product";
import type {
  AdminProductEditableFieldType,
  AdminProductFieldType,
} from "../bdo/admin/Product";

const product = new AdminProduct();

// ---- Field metadata ----
console.log(product.meta._id);       // "BDO_Product"
console.log(product.Title.label);    // "Product Title"
console.log(product.Title.required); // true

// ---- Get a single item ----
const item = await product.get("prod_abc123");
console.log(item._id);              // "prod_abc123"
console.log(item.Title.get());      // "Wireless Headphones"
console.log(item.Price.get());      // 99.99

// ---- List items with filter ----
const items = await product.list({
  Filter: {
    Operator: "And",
    Condition: [{
      LHSField: product.Category.id,
      Operator: "EQ",
      RHSValue: "Electronics",
      RHSType: "Constant",
    }],
  },
  Sort: [{ [product.Price.id]: "ASC" }],
  Page: 1,
  PageSize: 20,
});

for (const item of items) {
  console.log(item.Title.get(), item.Price.get());
}

// ---- Count ----
const total = await product.count();
console.log(`Total products: ${total}`);

// ---- Create ----
const newItem = await product.create({
  Title: "New Product",
  Price: 49.99,
  Category: "Books",
});
console.log(newItem._id);          // New record ID
console.log(newItem.Title.get());  // "New Product"

// ---- Update ----
const updateResult = await product.update("prod_abc123", {
  Price: 79.99,
});
console.log(updateResult._id);     // "prod_abc123"

// ---- Delete ----
const deleteResult = await product.delete("prod_abc123");
console.log(deleteResult.status);  // "success"

// ---- Validate ----
const emptyItem = product.createItem();
emptyItem.Title.set("");
const validation = emptyItem.validate();
console.log(validation.valid);     // false
console.log(validation.errors);    // ["Product Title is required"]

// ---- SelectField options ----
const statusOptions = await product.Status.fetchOptions();
statusOptions.forEach((opt) => {
  console.log(`${opt.value}: ${opt.label}`);
});

// ---- ReferenceField options ----
const suppliers = await product.SupplierInfo.fetchOptions();
suppliers.forEach((sup) => {
  console.log(`${sup._id}: ${sup.SupplierName}`);
});
```

---

## Common Mistakes

### 1. Guessing field names instead of reading BDO files

ALWAYS read the BDO `.ts` files (`src/bdo/{role}/*.ts`) BEFORE writing page code. Use the exact field names from the class — NEVER guess or invent field names.

```typescript
// ❌ WRONG — guessing field names that don't exist
bdo.used        // TS2339: Property 'used' does not exist
bdo.remaining   // TS2339: Property 'remaining' does not exist
bdo.meta_title  // TS2339: actual field might be 'seo_title'
bdo.tags        // TS2339: no such field exists

// ✅ CORRECT — read the BDO file first, use exact names
// Check src/bdo/employee/LeaveBalance.ts for actual fields
bdo.UsedLeaves     // matches the actual field in the BDO class
bdo.RemainingDays  // matches the actual field in the BDO class
```

### 2. Inventing BDO classes that don't exist

Check `src/bdo/{role}/index.ts` to see which BDO classes actually exist before importing.

```typescript
// ❌ WRONG — ShippingAddress BDO doesn't exist
import { customerShippingAddress } from "@/bdo/customer/ShippingAddress";

// ✅ CORRECT — check index.ts first. shipping_address might just be a StringField on Order
import { customerOrder } from "@/bdo/customer/Order";
```

### 3. Calling protected methods

All `BaseBdo` methods are `protected` by default. Only the methods the role has permission for are re-exposed as `public` in the generated class. Read the BDO file to see which methods are available.

```typescript
// ❌ WRONG — if delete is not in the role's BDO class
await bdo.delete(id);  // TS2445: Property 'delete' is protected

// ✅ CORRECT — use api() for methods not exposed on the BDO class
import { api } from "@ram_28/kf-ai-sdk/api";
await api(bdo.meta._id).delete(id);

// ✅ CORRECT — for create/update, prefer useForm
const { handleSubmit } = useForm({ bdo });
```

### 4. Not handling `.get()` return type

`ItemType` field `.get()` returns `T | undefined`. Always handle the undefined case.

```typescript
// ❌ WRONG — might be undefined
const title: string = item.Title.get();

// ✅ CORRECT — provide fallback
const title = item.Title.get() ?? "";
const price = item.Price.get() ?? 0;
const active = item.IsActive.get() ?? false;
```
