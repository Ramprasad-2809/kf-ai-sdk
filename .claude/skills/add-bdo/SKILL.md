---
description: Create a new BDO class with role-based access
user_invocable: true
---

# /add-bdo — Create a New BDO Class

Follow these steps to create a new Business Data Object class. Ask the user for:
1. The entity name (e.g., "Product", "Order")
2. The Business Object ID (`bo_id`)
3. The fields and their types
4. Which role(s) to create (admin, viewer, etc.)
5. Which CRUD operations each role can perform

## Step 1: Define Entity Type

Create or update the entity type file with all field value types:

```typescript
import type { StringFieldType, NumberFieldType, ... } from "@ram_28/kf-ai-sdk/types";
import type { SystemFieldsType } from "@ram_28/kf-ai-sdk/bdo/types";

export type {Entity}Type = {
  Field1: StringFieldType;
  Field2: NumberFieldType;
  // ... all fields
} & SystemFieldsType;
```

## Step 2: Define Access Types

For each role, create Pick types:

```typescript
export type {Role}{Entity}EditableFieldType = Pick<{Entity}Type, "Field1" | "Field2">;
export type {Role}{Entity}ReadonlyFieldType = Pick<{Entity}Type, "ReadonlyField">;
export type {Role}{Entity}FieldType = {Role}{Entity}EditableFieldType & {Role}{Entity}ReadonlyFieldType & SystemFieldsType;
```

## Step 3: Create BDO Class

```typescript
export class {Role}{Entity} extends BaseBdo<{Entity}Type, EditableType, ReadonlyType> {
  readonly meta = { _id: BO_ID, name: "{Entity}" } as const;

  // Field declarations with raw backend meta
  readonly Field1 = new StringField({ _id: "Field1", Name: "Field 1", Type: "String" });

  // Public CRUD methods (role-based)
  public async get(id: string) { return super.get(id); }
}
```

## Step 4: Verify

- System fields (`_id`, `_created_at`, etc.) are NOT redeclared
- `meta._id` matches the backend Business Object ID
- Field `_id` values match property names
- Only permitted CRUD methods are exposed as public

```bash
pnpm run typecheck
pnpm run build
```
