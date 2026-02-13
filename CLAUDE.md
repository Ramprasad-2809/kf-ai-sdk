# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Build the SDK (Vite + TypeScript declarations)
npm run build

# Development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check

# Testing
npm run test
npm run test:watch
```

## Architecture Overview

This is a React SDK (`@ram_28/kf-ai-sdk`) providing type-safe hooks for building web applications with a backend API. The SDK follows a modular entry point pattern for tree-shaking.

### Directory Structure

- **`sdk/`** - Source code
  - **`components/hooks/`** - Core React hooks (`useForm`, `useTable`, `useFilter`)
  - **`api/`** - API client for CRUD operations against Business Objects
  - **`auth/`** - Authentication (AuthProvider, useAuth hook)
  - **`bdo/`** - Business Data Object module (type-safe data access layer)
  - **`types/`** - Shared type definitions (base field types, common types)
  - **`utils/`** - Formatting helpers, error handling, API utilities
- **`config/`** - Vite build configuration
- **`docs/`** - Hook documentation (useTable, useFilter)

### Module Entry Points

The SDK uses multiple entry points defined in `package.json` exports. Each module has a separate entry file in `sdk/`:
- `form.ts`, `table.ts`, `filter.ts` - Hook entry points
- `auth.ts`, `api.ts`, `utils.ts` - Service entry points
- `bdo.ts` - Business Data Object entry point
- `base-types.ts` - Core type definitions
- Corresponding `.types.ts` files for type-only exports

Build output goes to `dist/` with both ESM (`.mjs`) and CJS (`.cjs`) formats.

### API Client Pattern

The SDK uses a resource client pattern for API calls:
```typescript
api("business_object").get(id)
api("business_object").list({ Filter, Sort, Page, PageSize })
api("business_object").create(data)
api("business_object").update(id, data)
api("business_object").delete(id)
```

All API calls are made to `/api/app/{bo_id}/` endpoints. The client supports draft operations, metrics, and field metadata fetching.

### Hook Architecture

Hooks integrate with `@tanstack/react-query` for data fetching and caching:
- **useTable** - Manages table state (sorting, pagination, filtering) with React Query integration
- **useForm** - BDO-integrated forms with automatic type + constraint + expression validation
- **useFilter** - Filter condition builder with logical operators (AND/OR)

### Path Aliases

Use `@sdk/*` to import from the SDK source (configured in `tsconfig.json` and `vite.config.js`).

---

## BDO (Business Data Object) Module

The BDO module (`sdk/bdo/`) provides a type-safe, role-based data access layer for business objects with expression-based validation.

### Directory Structure

```
sdk/bdo/
├── core/
│   ├── BaseBdo.ts      # Abstract base class with protected CRUD + expression validation
│   ├── Item.ts         # Proxy-based wrapper for field accessor access
│   └── types.ts        # Raw meta types, accessor types, validation types
├── fields/
│   ├── BaseField.ts    # Abstract base — stores raw meta, exposes convenience getters
│   ├── StringField.ts  # String values (length constraint)
│   ├── NumberField.ts  # Numeric values (integerPart/fractionPart)
│   ├── BooleanField.ts # Boolean values
│   ├── DateField.ts    # Date values
│   ├── DateTimeField.ts# Date/time values (precision constraint)
│   ├── SelectField.ts  # Single selection — options from Constraint.Enum
│   ├── ReferenceField.ts # References to other BDOs — config from View.DataObject
│   ├── ArrayField.ts   # Array values
│   ├── ObjectField.ts  # Nested object values
│   ├── TextField.ts    # Multi-line text (Type: "Text"), format getter
│   ├── UserField.ts    # User references (Type: "User"), value { _id, _name }
│   ├── FileField.ts    # File attachments (Type: "File")
│   ├── TextAreaField.ts# Deprecated re-export alias for TextField
│   └── index.ts        # Field exports
├── expressions/
│   ├── types.ts        # Expression tree and metadata type definitions
│   ├── functions.ts    # Built-in functions (23 total)
│   ├── evaluator.ts    # Core expression evaluation logic
│   ├── ExpressionEngine.ts # Main validation orchestrator
│   └── index.ts        # Expression module exports
└── index.ts            # Module exports
```

### Core Concepts

#### 1. BaseBdo<TEntity, TEditable, TReadonly>

Abstract base class with 3 generic parameters. All CRUD methods are **protected** — subclasses selectively expose as **public** based on role permissions.

```typescript
// Protected methods in BaseBdo:
protected async get(id): Promise<ItemType<TEditable, TReadonly>>
protected async list(options?): Promise<ItemType<TEditable, TReadonly>[]>
protected async count(options?): Promise<number>
protected async create(data: Partial<TEditable>): Promise<ItemType<TEditable, TReadonly>>
protected async update(id, data): Promise<CreateUpdateResponseType>
protected async delete(id): Promise<DeleteResponseType>
protected async draft(data: Partial<TEditable>): Promise<DraftResponseType>
protected async draftInteraction(data): Promise<DraftResponseType & { _id: string }>
protected async draftPatch(id, data): Promise<DraftResponseType>
protected async metric(options): Promise<MetricResponseType>
protected async pivot(options): Promise<PivotResponseType>
protected createItem(data?): ItemType<TEditable, TReadonly>

// Expression validation methods:
loadMetadata(metadata: BDOMetadata): void
hasMetadata(): boolean
validateFieldExpression(fieldId, value, allValues): ValidationResultType
```

**Key: `create()` returns `ItemType`, not `CreateUpdateResponseType`.**

#### 2. BdoMeta

Every BDO declares `abstract readonly meta: BdoMetaType` where `BdoMetaType = { readonly _id: string; readonly name: string }`.

#### 3. Raw Backend Meta Field Constructors

Field classes take **raw backend JSON** directly as the constructor parameter. The full meta is stored and accessible.

```typescript
// Constructor receives exact backend JSON shape:
readonly Title = new StringField({
  _id: "Title",
  Name: "Product Title",
  Type: "String",
  Constraint: { Required: true, Length: 255 },
});

// Convenience getters derived from raw meta:
field.id          // → "Title" (from _meta._id)
field.label       // → "Product Title" (from _meta.Name)
field.readOnly    // → false (from _meta.ReadOnly)
field.required    // → true (from _meta.Constraint.Required)
field.defaultValue// → undefined (from _meta.DefaultValue or Constraint.DefaultValue)
field.primaryKey  // → false (from _meta.Constraint.PrimaryKey)
field.meta        // → full raw meta object
```

#### 4. ItemType and Runtime Accessors

`ItemType<TEditable, TReadonly>` wraps API response data with a Proxy. Each field is accessible as a property returning an accessor:

```typescript
const item = await product.get("id");

// Field accessor access (via Proxy):
item.Title.label          // "Product Title"
item.Title.required       // true
item.Title.readOnly       // false
item.Title.defaultValue   // undefined
item.Title.meta           // full raw backend meta
item.Title.get()          // current value
item.Title.set("New")     // set value (only on editable fields)
item.Title.validate()     // validate (type + expression rules)

// Direct _id access (not an accessor):
item._id                  // "product_123"

// Methods:
item.validate()           // Validate all fields
item.toJSON()             // Get raw data object
```

#### 5. Field Classes

All fields extend `BaseField<T>` which stores `_meta: BaseFieldMetaType`.

| Field Class | Type | Extra Getters | Meta Type |
|-------------|------|---------------|-----------|
| `StringField` | `"String"` | `length` | `StringFieldMetaType` |
| `NumberField` | `"Number"` | `integerPart`, `fractionPart` | `NumberFieldMetaType` |
| `BooleanField` | `"Boolean"` | - | `BooleanFieldMetaType` |
| `DateField` | `"Date"` | - | `DateFieldMetaType` |
| `DateTimeField` | `"DateTime"` | `precision` | `DateTimeFieldMetaType` |
| `SelectField<T>` | `"String"` | `options` (from `Constraint.Enum`) | `SelectFieldMetaType` |
| `ReferenceField<T>` | `"Reference"` | `referenceBdo`, `referenceFields`, `searchFields` (from `View`) | `ReferenceFieldMetaType` |
| `TextField` | `"Text"` | `format` (from `Constraint.Format`) | `TextFieldMetaType` |
| `UserField` | `"User"` | `businessEntity` | `UserFieldMetaType` |
| `FileField` | `"File"` | - | `FileFieldMetaType` |
| `ArrayField<T>` | `"Array"` | `elementType` | `ArrayFieldMetaType` |
| `ObjectField<T>` | `"Object"` | `properties` (from `Property`) | `ObjectFieldMetaType` |
| `TextAreaField` | - | Deprecated re-export alias for `TextField` | - |

#### 6. Constraint/View/Property Backend Model

Field configuration uses three structures (replacing old `Values.Mode`/`Values.Items`/`Values.Reference`):

- **Constraint**: `{ Required?, PrimaryKey?, DefaultValue?, Length?, IntegerPart?, FractionPart?, Enum?, Precision?, Format? }`
- **View**: `{ DataObject?: { Type, Id }, Fields?, Search?, Filter?, Sort?, BusinessEntity? }` — for Reference, String+DataObject, User
- **Property**: `BaseFieldMetaType` (Array element type descriptor) or `Record<string, BaseFieldMetaType>` (Object nested fields)

#### 7. readOnly Model

The `readOnly` boolean replaces the old `isEditable` pattern (inverted logic):
- `field.readOnly` — boolean getter on BaseField
- `meta.ReadOnly` — raw meta property
- Used consistently in: createResolver (skip readonly fields), useForm (filter editable fields), Item proxy (no `set()` for readonly)

#### 8. System Fields

System fields are defined in `BaseBdo` and inherited by all BDOs:

```typescript
readonly _id = new StringField({ _id: "_id", Name: "ID", Type: "String", ReadOnly: true });
readonly _created_at = new DateTimeField({ _id: "_created_at", Name: "Created At", Type: "DateTime", ReadOnly: true });
readonly _modified_at = new DateTimeField({ _id: "_modified_at", Name: "Modified At", Type: "DateTime", ReadOnly: true });
readonly _created_by = new UserField({ _id: "_created_by", Name: "Created By", Type: "User", ReadOnly: true });
readonly _modified_by = new UserField({ _id: "_modified_by", Name: "Modified By", Type: "User", ReadOnly: true });
readonly _version = new StringField({ _id: "_version", Name: "Version", Type: "String", ReadOnly: true });
readonly _m_version = new StringField({ _id: "_m_version", Name: "Metadata Version", Type: "String", ReadOnly: true });
```

### Role-Based Access Pattern

BDOs control access by selectively exposing protected methods as public:

```typescript
// Full Access (Admin)
export class AdminProduct extends BaseBdo<ProductType, AdminProductEditableFieldType, AdminProductReadonlyFieldType> {
  readonly meta = { _id: PRODUCT_BO_ID, name: "Product" } as const;
  readonly Title = new StringField({ _id: "Title", Name: "Product Title", Type: "String", Constraint: { Required: true, Length: 255 } });

  public async get(id) { return super.get(id); }
  public async create(data) { return super.create(data); }
  public async update(id, data) { return super.update(id, data); }
  public async delete(id) { return super.delete(id); }
}

// Read Only (Buyer viewing products)
export class BuyerProduct extends BaseBdo<ProductType, {}, BuyerProductReadonlyFieldType> {
  public async get(id) { return super.get(id); }
  public async list(options?) { return super.list(options); }
  // create, update, delete NOT exposed
}
```

### BDO Implementation Pattern

Every BDO follows this structure:

```typescript
import {
  BaseBdo, StringField, NumberField,
} from "@ram_28/kf-ai-sdk/bdo";
import type { ItemType, SystemFieldsType } from "@ram_28/kf-ai-sdk/bdo/types";
import type { ListOptionsType } from "@ram_28/kf-ai-sdk/api/types";

// 1. Field access types (Pick from entity type)
export type MyBdoEditableFieldType = Pick<EntityType, "Field1" | "Field2">;
export type MyBdoReadonlyFieldType = Pick<EntityType, "ReadonlyField1">;
export type MyBdoFieldType = MyBdoEditableFieldType & MyBdoReadonlyFieldType & SystemFieldsType;

// 2. Class extending BaseBdo with 3 generics
export class MyBdo extends BaseBdo<EntityType, MyBdoEditableFieldType, MyBdoReadonlyFieldType> {
  readonly meta = { _id: BO_ID, name: "Entity" } as const;

  // 3. Field definitions with raw backend meta JSON
  readonly Field1 = new StringField({ _id: "Field1", Name: "Field 1", Type: "String", Constraint: { Required: true } });
  readonly Field2 = new NumberField({ _id: "Field2", Name: "Field 2", Type: "Number", Constraint: { IntegerPart: 9, FractionPart: 2 } });

  // 4. Re-exposed CRUD methods (based on role permissions)
  public async get(id: string): Promise<ItemType<MyBdoEditableFieldType, MyBdoReadonlyFieldType>> {
    return super.get(id);
  }
  public async create(data: Partial<MyBdoEditableFieldType>): Promise<ItemType<MyBdoEditableFieldType, MyBdoReadonlyFieldType>> {
    return super.create(data);
  }

}
```

---

## Type System

### Field Value Types (`sdk/types/base-fields.ts`)

| Type | Resolves To |
|------|-------------|
| `StringFieldType` | `string` |
| `TextFieldType` | `string` |
| `NumberFieldType` | `number` |
| `BooleanFieldType` | `boolean` |
| `DateFieldType` | `"YYYY-MM-DD"` |
| `DateTimeFieldType` | `"YYYY-MM-DDThh:mm:ss"` |
| `SelectFieldType<T>` | `T` |
| `ReferenceFieldType<T>` | `T` |
| `UserFieldType` | `{ _id: string; _name: string }` |
| `FileFieldType` | `Record<string, unknown>` |
| `ArrayFieldType<T>` | `T[]` |
| `ObjectFieldType<T>` | `T` |

### Deprecated / Removed Types
- `UserRefType` — deprecated alias for `UserFieldType`
- `TextAreaFieldType` — deprecated alias for `TextFieldType`
- Removed: `LongFieldType`, `CurrencyFieldType`, `JSONFieldType`, `JSONValueType`

### SystemFieldsType

```typescript
type SystemFieldsType = {
  _id: StringFieldType;
  _created_at: DateTimeFieldType;
  _modified_at: DateTimeFieldType;
  _created_by: UserFieldType;
  _modified_by: UserFieldType;
  _version: StringFieldType;
  _m_version: StringFieldType;
};
```

### Raw Backend Meta Types (in `sdk/bdo/core/types.ts`)

All field meta types extend `BaseFieldMetaType`:

```typescript
interface BaseFieldMetaType {
  _id: string;           // field key
  Name: string;          // display name
  Type: string;          // field type discriminator
  ReadOnly?: boolean;
  Constraint?: BaseConstraintType;
  DefaultValue?: unknown;
}

interface BaseConstraintType {
  Required?: boolean;
  PrimaryKey?: boolean;
  DefaultValue?: unknown;
}
```

Per-field meta types: `StringFieldMetaType`, `NumberFieldMetaType`, `BooleanFieldMetaType`, `DateFieldMetaType`, `DateTimeFieldMetaType`, `SelectFieldMetaType`, `ReferenceFieldMetaType`, `UserFieldMetaType`, `ArrayFieldMetaType`, `ObjectFieldMetaType`, `FileFieldMetaType`, `TextFieldMetaType`.

### Runtime Accessor Types

```typescript
interface BaseFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  validate(): ValidationResultType;
}

interface EditableFieldAccessorType<T> extends BaseFieldAccessorType<T> {
  set(value: T): void;
}

type ReadonlyFieldAccessorType<T> = BaseFieldAccessorType<T>;
```

---

## Expression Engine

The expression engine (`sdk/bdo/expressions/`) enables backend-defined validation rules to be evaluated on the frontend. This allows `item.field.validate()` and `useForm` to use expression tree validation rules from the backend schema.

### Architecture

```
User blurs field "Price"
         |
         v
RHF triggers resolver (createResolver)
         |
         v
Validation pipeline:
         |
         +-> 1. Type validation: field.validate(value)
         |      -> NumberField checks: typeof value === "number"
         |
         +-> 2. Constraint validation: validateConstraints(field, value)
         |      -> Required, string length, number integerPart/fractionPart
         |
         +-> 3. Expression validation: bdo.validateFieldExpression()
         |      -> ExpressionEngine evaluates: "Price != null", "Price > 0"
         |
         v
Returns { values, errors } to RHF -> UI displays error
```

### Expression Tree Types

Backend validation rules use expression trees (AST nodes):

```typescript
interface ExpressionTreeType {
  Type: "BinaryExpression" | "LogicalExpression" | "CallExpression" |
        "MemberExpression" | "AssignmentExpression" | "Identifier" |
        "Literal" | "SystemIdentifier";
  Operator?: string;
  Callee?: string;
  Arguments?: ExpressionTreeType[];
  Name?: string;
  Value?: unknown;
}
```

### Supported Operators

| Category | Operators |
|----------|-----------|
| Comparison | `==`, `!=`, `<`, `<=`, `>`, `>=` |
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Logical | `AND`, `OR`, `!` |

### Built-in Functions (23 total)

| Category | Functions |
|----------|-----------|
| String (7) | `CONCAT`, `UPPER`, `LOWER`, `TRIM`, `LENGTH`, `SUBSTRING`, `REPLACE` |
| Math (8) | `SUM`, `AVG`, `MIN`, `MAX`, `ABS`, `ROUND`, `FLOOR`, `CEIL` |
| Date (6) | `YEAR`, `MONTH`, `DAY`, `DATE_DIFF`, `ADD_DAYS`, `ADD_MONTHS` |
| Conditional (1) | `IF` |
| System (1) | `UUID` |

### System Identifiers

Available in all expressions: `NOW`, `TODAY`, `CURRENT_USER` (with `.Id`, `.Email`, etc.)

---

## useForm Hook

The `useForm` hook integrates BDO with React Hook Form, providing automatic validation and API calls.

### Features

- **3-phase validation** via resolver (type + constraint + expression)
- **Constraint validation** from field meta (required, length, integerPart/fractionPart)
- **Expression validation** from backend schema (fetched automatically)
- **Automatic API calls** via handleSubmit (insert for create, update for edit)
- **Item proxy** always in sync with form state
- **readOnly field skipping** — readonly fields are not validated
- **`enableConstraintValidation`** option (defaults to `true`)

### Usage

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { AdminProduct } from "./bdo/admin/Product";

const product = new AdminProduct();

// Create mode
const { register, handleSubmit, item, errors } = useForm({
  bdo: product,
  defaultValues: { Title: "", Price: 0 },
});

// Edit mode
const { register, handleSubmit, item, isLoading } = useForm({
  bdo: product,
  recordId: "product_123",
});

// Disable constraint validation (only type + expression)
const form = useForm({
  bdo: product,
  enableConstraintValidation: false,
});

// In JSX
<form onSubmit={handleSubmit(
  (result) => toast.success("Saved!"),
  (error) => toast.error(error.message)
)}>
  <input {...register("Title")} />
  {errors.Title && <span>{errors.Title.message}</span>}
</form>
```

### createResolver — 3-Phase Validation

```typescript
// Phase 1: Type validation (from field.validate())
const typeResult = field.validate(value);

// Phase 2: Constraint validation (from field meta)
// Checks: required, string length, number integerPart/fractionPart
// Controlled by enableConstraintValidation option
const constraintResult = validateConstraints(field, value);

// Phase 3: Expression validation (from backend rules)
if (bdo.hasMetadata()) {
  const exprResult = bdo.validateFieldExpression(fieldName, value, allValues);
}
```

Readonly fields (`field.readOnly === true`) are skipped entirely.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `sdk/bdo.ts` | Main entry point for `@ram_28/kf-ai-sdk/bdo` |
| `sdk/bdo/core/BaseBdo.ts` | Abstract base class with protected CRUD + 3-generic pattern |
| `sdk/bdo/core/Item.ts` | Proxy wrapper, ItemType, runtime accessor construction |
| `sdk/bdo/core/types.ts` | Raw meta types, accessor types, validation types |
| `sdk/bdo/fields/BaseField.ts` | Abstract base — `_meta` storage, convenience getters |
| `sdk/bdo/fields/StringField.ts` | String field with `length` getter |
| `sdk/bdo/fields/NumberField.ts` | Number field with `integerPart`/`fractionPart` getters |
| `sdk/bdo/fields/SelectField.ts` | Options from `Constraint.Enum` |
| `sdk/bdo/fields/ReferenceField.ts` | Config from `View.DataObject` |
| `sdk/bdo/fields/TextField.ts` | Multi-line text with `format` getter |
| `sdk/bdo/fields/UserField.ts` | User references (`{ _id, _name }`) |
| `sdk/bdo/fields/FileField.ts` | File attachments |
| `sdk/bdo/expressions/types.ts` | ExpressionTreeType, ValidationRule, BDOMetadata |
| `sdk/bdo/expressions/functions.ts` | 23 built-in functions |
| `sdk/bdo/expressions/evaluator.ts` | evaluateNode(), getSystemValues() |
| `sdk/bdo/expressions/ExpressionEngine.ts` | Main validation class |
| `sdk/types/base-fields.ts` | Field value types, SystemFieldsType |
| `sdk/api/metadata.ts` | getBdoSchema(), listMetadata(), FieldMetadataType |
| `sdk/components/hooks/useForm/useForm.ts` | Form hook with schema fetching |
| `sdk/components/hooks/useForm/createResolver.ts` | RHF resolver with 3-phase validation |
| `sdk/components/hooks/useForm/createItemProxy.ts` | Form-integrated item proxy |
| `sdk/components/hooks/useForm/types.ts` | UseFormOptionsType, form accessor types |

---

## Usage Example

```typescript
import { AdminProduct } from "./bdo/admin/Product";

const product = new AdminProduct();

// Field meta access (on BDO class)
product.Price.id           // "Price"
product.Price.label        // "Price"
product.Price.required     // true
product.Price.readOnly     // false
product.Price.meta         // full raw backend meta

// Use field meta in filters
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

// Work with items
for (const item of items) {
  console.log(item._id);                    // Direct access
  console.log(item.Title.get());            // Via accessor
  console.log(item.Title.label);            // "Product Title"
  console.log(item.Title.required);         // true
  item.Price.set(item.Price.get()! * 1.1);  // Update price

  // Validate (runs type + expression validation)
  const result = item.Price.validate();
  if (!result.valid) {
    console.error(result.errors);
  }
}

// Create new record (returns ItemType, not just { _id })
const newItem = await product.create({
  Title: "New Product",
  Price: 99.99,
});
console.log(newItem._id);          // New record ID
console.log(newItem.Title.get());  // "New Product"
```
