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
- **useForm** - BDO-integrated forms with automatic type + expression validation
- **useFilter** - Filter condition builder with logical operators (AND/OR)

### Type System

Semantic field types for data modeling (`sdk/types/base-fields.ts`):
- `StringFieldType`, `NumberFieldType`, `CurrencyFieldType`
- `DateFieldType`, `DateTimeFieldType`, `BooleanFieldType`
- `SelectFieldType<T>`, `LookupFieldType`, `ReferenceFieldType`

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
│   └── types.ts        # Core interfaces (FieldMeta, ValidationResult, etc.)
├── fields/
│   ├── BaseField.ts    # Abstract base for all field types
│   ├── StringField.ts  # String values
│   ├── NumberField.ts  # Numeric values
│   ├── BooleanField.ts # Boolean values
│   ├── DateTimeField.ts# Date/time values
│   ├── SelectField.ts  # Single selection with predefined options
│   ├── ReferenceField.ts # References to other BDOs
│   ├── ArrayField.ts   # Array values
│   └── index.ts        # Field exports
├── expressions/
│   ├── types.ts        # Expression tree and metadata type definitions
│   ├── functions.ts    # Built-in functions (23 total)
│   ├── evaluator.ts    # Core expression evaluation logic
│   ├── ExpressionEngine.ts # Main validation orchestrator
│   └── index.ts        # Expression module exports
├── accessors/
│   ├── FieldAccessor.ts       # Base accessor with get/set/validate
│   ├── SelectFieldAccessor.ts # Adds options() method
│   ├── ReferenceFieldAccessor.ts # Adds reference info
│   └── index.ts
└── index.ts            # Module exports
```

### Core Concepts

#### 1. BaseBdo<TEntity, TCreateType, TReadType, TUpdateType>

Abstract base class that all BDOs extend. Has **protected** CRUD methods that subclasses selectively expose as **public** based on role permissions.

```typescript
// Protected methods in BaseBdo:
protected async get(id): Promise<ItemWithData<TReadType>>
protected async list(options?): Promise<ItemWithData<TReadType>[]>
protected async count(options?): Promise<number>
protected async create(data: Partial<TCreateType>): Promise<CreateUpdateResponseType>
protected async update(id, data): Promise<CreateUpdateResponseType>
protected async delete(id): Promise<DeleteResponseType>
protected async draft(data: Partial<TCreateType>): Promise<DraftResponseType>
protected async draftInteraction(data): Promise<DraftResponseType & { _id: string }>
protected async draftPatch(id, data): Promise<DraftResponseType>
protected async metric(options): Promise<MetricResponseType>
protected async pivot(options): Promise<PivotResponseType>

// Expression validation methods:
loadMetadata(metadata: BDOMetadata): void     // Load backend schema for expression validation
hasMetadata(): boolean                         // Check if metadata is loaded
validateFieldExpression(fieldId, value, allValues): ValidationResult  // Validate using expressions
```

#### 2. Item<T> and ItemWithData<T>

`Item` wraps API response data with a Proxy that provides field accessors:

```typescript
const item = await product.get("id");

// Field accessor access (via Proxy):
item.Title.get()           // Get value
item.Title.set("New")      // Set value
item.Title.validate()      // Validate (type + expression rules)
item.Title.meta.id         // "Title"
item.Title.meta.label      // "Product Title"

// Direct _id access (not an accessor):
item._id                   // "product_123" (always present)

// Methods:
item.validate()            // Validate all fields (type + expression rules)
item.toJSON()              // Get raw data object
```

`ItemWithData<T>` is the type that combines Item with typed field accessors.

#### 3. FieldMeta Interface

All fields expose metadata via `meta` property:

```typescript
interface FieldMeta {
  readonly id: string;
  readonly label: string;
  readonly options?: readonly { value: unknown; label: string; disabled?: boolean }[];  // SelectField only
  readonly reference?: { bdo: string; fields: string[] };  // ReferenceField only
}
```

Works on both BDO field definitions AND Item field accessors:
```typescript
product.Price.meta.id      // On BDO class
item.Price.meta.id         // On Item (same result)
```

#### 4. Field Classes

All field classes only expose `id` and `label` via the `meta` getter. No validation properties (required, min, max, etc.) are exposed.

| Field Class | Purpose | Extra in meta |
|-------------|---------|---------------|
| `StringField` | Text values | - |
| `NumberField` | Numeric values | - |
| `BooleanField` | True/false | - |
| `DateTimeField` | Timestamps | - |
| `SelectField<T>` | Single selection | `options` |
| `ReferenceField<T>` | Links to other BDOs | `reference` |
| `ArrayField<T>` | Array values | - |

### Role-Based Access Pattern

BDOs control access by selectively exposing protected methods as public:

```typescript
// Full Access (Admin)
export class AdminProduct extends BaseBdo<...> {
  public async get(id) { return super.get(id); }
  public async list(options?) { return super.list(options); }
  public async create(data) { return super.create(data); }
  public async update(id, data) { return super.update(id, data); }
  public async delete(id) { return super.delete(id); }
  // ... all methods exposed
}

// Read Only (Buyer viewing products)
export class BuyerProduct extends BaseBdo<ProductType, never, BuyerProductReadType, never> {
  public async get(id) { return super.get(id); }
  public async list(options?) { return super.list(options); }
  public async count(options?) { return super.count(options); }
  // create, update, delete NOT exposed
}

// CRUD without Delete (Seller managing products)
export class SellerProduct extends BaseBdo<...> {
  public async get(id) { return super.get(id); }
  public async list(options?) { return super.list(options); }
  public async create(data) { return super.create(data); }
  public async update(id, data) { return super.update(id, data); }
  // delete NOT exposed
}
```

### BDO Implementation Pattern

Every BDO follows this structure:

```typescript
import {
  BaseBdo, StringField, NumberField, // ... field classes
  type ItemWithData, type BaseField,
} from "@ram_28/kf-ai-sdk/bdo";
import { api } from "@ram_28/kf-ai-sdk/api";

// 1. Operation-specific types
export type MyBdoCreateType = Pick<EntityType, "Field1" | "Field2">;
export type MyBdoReadType = Pick<EntityType, "_id" | "Field1" | "Field2" | "Field3">;
export type MyBdoUpdateType = Partial<MyBdoCreateType>;

// 2. Class extending BaseBdo
export class MyBdo extends BaseBdo<EntityType, MyBdoCreateType, MyBdoReadType, MyBdoUpdateType> {
  readonly boId = "BO_ID";

  // 3. Field definitions (only id and label)
  readonly Field1 = new StringField({ id: "Field1", label: "Field 1" });
  readonly Field2 = new NumberField({ id: "Field2", label: "Field 2" });

  // 4. Required getFields() method
  getFields(): Record<string, BaseField<unknown>> {
    return { _id: this._id, Field1: this.Field1, Field2: this.Field2 };
  }

  // 5. Re-exposed CRUD methods (based on role permissions)
  public async get(id: StringFieldType): Promise<ItemWithData<MyBdoReadType>> {
    return super.get(id);
  }
  // ... other methods as needed

  // 6. Metadata operations (not in BaseBdo)
  async fetchFields(): Promise<FieldsResponseType> {
    return api(this.boId).fields();
  }
  async fetchField(instanceId: string, fieldId: string): Promise<FetchFieldOptionType[]> {
    return api(this.boId).fetchField(instanceId, fieldId);
  }
}
```

---

## Expression Engine

The expression engine (`sdk/bdo/expressions/`) enables backend-defined validation rules to be evaluated on the frontend. This allows `item.field.validate()` and `useForm` to use expression tree validation rules from the backend schema.

### Architecture

```
User blurs field "Price"
         │
         ▼
RHF triggers resolver (createResolver)
         │
         ▼
Validation pipeline:
         │
         ├─► 1. Type validation: field.validate(value)
         │      └─► NumberField checks: typeof value === "number"
         │
         ├─► 2. Expression validation: bdo.validateFieldExpression()
         │      └─► ExpressionEngine evaluates: "Price != null", "Price > 0"
         │
         ▼
Returns { values, errors } to RHF → UI displays error
```

### Expression Tree Types

Backend validation rules use expression trees (AST nodes):

```typescript
interface ExpressionTreeType {
  Type: "BinaryExpression" | "LogicalExpression" | "CallExpression" |
        "MemberExpression" | "AssignmentExpression" | "Identifier" |
        "Literal" | "SystemIdentifier";
  Operator?: string;      // ==, !=, <, >, AND, OR, +, -, etc.
  Callee?: string;        // Function name for CallExpression
  Arguments?: ExpressionTreeType[];  // Child nodes
  Name?: string;          // Field name for Identifier
  Value?: unknown;        // Value for Literal
}
```

### Backend Validation Schema Example

```json
{
  "Id": "Price",
  "Name": "Price",
  "Type": "Number",
  "Validation": [
    {
      "Id": "RULE_PRICE_REQUIRED",
      "Expression": "Price != null",
      "ExpressionTree": {
        "Type": "BinaryExpression",
        "Operator": "!=",
        "Arguments": [
          { "Type": "Identifier", "Name": "Price" },
          { "Type": "Literal", "Value": null }
        ]
      },
      "Message": "Price is required"
    }
  ]
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

Available in all expressions:
- `NOW` - Current date and time
- `TODAY` - Current date (midnight)
- `CURRENT_USER` - Current authenticated user object (with `.Id`, `.Email`, etc.)

### ExpressionEngine Class

```typescript
import { ExpressionEngine, type BDOMetadata } from "@ram_28/kf-ai-sdk/bdo";

const engine = new ExpressionEngine();

// Load metadata from backend
engine.loadMetadata(bdoMetadata);

// Validate a single field
const result = engine.validateField("Price", 50, { Price: 50, MRP: 100 });
// => { valid: true, errors: [] }

// Validate all fields
const allResults = engine.validateAll({ Price: -10, MRP: 100 });
// => { valid: false, errors: ["Price must be greater than 0"] }
```

### Graceful Fallback

- If no metadata is loaded, expression validation is skipped (returns valid)
- Type validation always runs regardless of metadata
- Failed expression evaluation logs a warning but continues with other rules

---

## useForm Hook

The `useForm` hook integrates BDO with React Hook Form, providing automatic validation (type + expression) and API calls.

### Features

- **Automatic validation** via resolver (no need to pass rules to register)
- **Expression validation** from backend schema (fetched automatically)
- **Automatic API calls** via handleSubmit (insert for create, update for edit)
- **Item proxy** always in sync with form state
- **Simple create/edit mode** switching via recordId

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

// In JSX - validation AND API call are automatic!
<form onSubmit={handleSubmit(
  (result) => toast.success("Saved!"),
  (error) => toast.error(error.message)
)}>
  <input {...register("Title")} />
  {errors.Title && <span>{errors.Title.message}</span>}
</form>
```

### Schema Fetching

`useForm` automatically:
1. Fetches BDO schema via `getBdoSchema(bdo.boId)`
2. Caches schema for 30 minutes (`staleTime: 30 * 60 * 1000`)
3. Loads metadata into BDO via `bdo.loadMetadata(schema.BOBlob)`
4. Expression validation then works automatically in the resolver

### createResolver

The resolver validates fields in two phases:

```typescript
// 1. Type validation (from field.validate())
const typeResult = field.validate(value);
if (!typeResult.valid) return errors;

// 2. Expression validation (from backend rules)
if (bdo.hasMetadata()) {
  const exprResult = bdo.validateFieldExpression(fieldName, value, allValues);
  if (!exprResult.valid) return errors;
}
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `sdk/bdo.ts` | Main entry point for `@ram_28/kf-ai-sdk/bdo` |
| `sdk/bdo/index.ts` | Internal module exports |
| `sdk/bdo/core/BaseBdo.ts` | Abstract base class with protected CRUD + expression validation |
| `sdk/bdo/core/Item.ts` | Proxy wrapper, FieldAccessorLike interface |
| `sdk/bdo/core/types.ts` | FieldMeta, ValidationResult, configs |
| `sdk/bdo/fields/BaseField.ts` | Abstract base with `meta` getter |
| `sdk/bdo/fields/SelectField.ts` | Adds `options` to meta |
| `sdk/bdo/fields/ReferenceField.ts` | Adds `reference` to meta |
| `sdk/bdo/expressions/types.ts` | ExpressionTreeType, ValidationRule, BDOMetadata |
| `sdk/bdo/expressions/functions.ts` | 23 built-in functions |
| `sdk/bdo/expressions/evaluator.ts` | evaluateNode(), getSystemValues() |
| `sdk/bdo/expressions/ExpressionEngine.ts` | Main validation class |
| `sdk/api/metadata.ts` | getBdoSchema(), listMetadata() |
| `sdk/components/hooks/useForm/useForm.ts` | Form hook with schema fetching |
| `sdk/components/hooks/useForm/createResolver.ts` | RHF resolver with type + expression validation |

---

## Usage Example

```typescript
import { AdminProduct } from "./bdo/admin/Product";

const product = new AdminProduct();

// Use field meta in filters
const items = await product.list({
  Filter: {
    Operator: "And",
    Condition: [{
      LHSField: product.Price.meta.id,  // "Price"
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
  item.Price.set(item.Price.get()! * 1.1);  // Update price

  // Validate (runs type + expression validation if metadata loaded)
  const result = item.Price.validate();
  if (!result.valid) {
    console.error(result.errors);
  }
}

// Create new record
const result = await product.create({
  Title: "New Product",
  Price: 99.99,
});
console.log(result._id);  // New record ID
```
