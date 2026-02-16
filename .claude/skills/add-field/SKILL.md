---
description: Add a new BDO field type to the SDK
user_invocable: true
---

# /add-field — Add a New BDO Field Type

Follow these steps in order. Use `sdk/bdo/fields/StringField.ts` as the canonical reference.

## Step 1: Define the Meta Type

In `sdk/bdo/core/types.ts`, add a new interface extending `BaseFieldMetaType`:

```typescript
export interface {Name}FieldMetaType extends BaseFieldMetaType {
  Type: "{Name}";
  Constraint?: BaseConstraintType & {
    // Add field-specific constraints here
  };
}
```

## Step 2: Define the Value Type

In `sdk/types/base-fields.ts`, add:

```typescript
export type {Name}FieldType = /* the runtime value type */;
```

## Step 3: Create the Field Class

Create `sdk/bdo/fields/{Name}Field.ts`:

1. Import the value type from `../../types/base-fields`
2. Import the meta type and `ValidationResultType` from `../core/types`
3. Import `BaseField` from `./BaseField`
4. Extend `BaseField<{Name}FieldType>`
5. Constructor takes `{Name}FieldMetaType`
6. Add field-specific getters derived from `_meta.Constraint`
7. Implement `validate()` with type checking

## Step 4: Export

1. Add to `sdk/bdo/fields/index.ts`
2. Add to `sdk/bdo/index.ts` (re-export)
3. Add to `sdk/bdo.ts` (entry point re-export)
4. Add meta type to `sdk/bdo.types.ts` (type-only entry point re-export)
5. Add value type to `sdk/base-types.ts` if not already there

## Step 5: Write Tests

Create `sdk/__tests__/bdo/fields/{Name}Field.test.ts`:
- Test constructor with valid meta
- Test getter values
- Test `validate()` with valid and invalid values

## Step 6: Verify

```bash
pnpm run typecheck
pnpm run build
pnpm run test
```
