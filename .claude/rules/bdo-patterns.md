# BDO Patterns

## Adding a New Field Class

1. Create `sdk/bdo/fields/{FieldName}Field.ts` extending `BaseField<ValueType>`
2. Define `{FieldName}FieldMetaType` in `sdk/bdo/core/types.ts` extending `BaseFieldMetaType`
3. Add value type alias in `sdk/types/base-fields.ts` (e.g., `type FooFieldType = ...`)
4. Export from `sdk/bdo/fields/index.ts`
5. Re-export from `sdk/bdo/index.ts` and `sdk/bdo.ts`
6. Use `StringField.ts` as the canonical example for structure

## Adding a New BDO Class

1. Define entity type with all field value types
2. Define `EditableFieldType = Pick<Entity, "field1" | "field2">`
3. Define `ReadonlyFieldType = Pick<Entity, "readonlyField1">`
4. Extend `BaseBdo<Entity, Editable, Readonly>`
5. Declare `readonly meta = { _id: BO_ID, name: "Name" } as const`
6. Declare field instances with `new FieldClass({...raw meta...})`
7. Expose CRUD methods as `public` based on role permissions

## System Fields — Never Redeclare

These are inherited from `BaseBdo` and must not be redefined in subclasses:
`_id`, `_created_at`, `_modified_at`, `_created_by`, `_modified_by`, `_version`, `_m_version`

## Field Meta Conventions

- `_id` in meta must match the property name on the BDO class
- `Type` must match the field class (e.g., `StringField` → `Type: "String"`)
- `Constraint` is optional — only include properties that apply
- `ReadOnly: true` means the field won't have `set()` on ItemType accessors

## Three Generics Pattern

```
BaseBdo<TEntity, TEditable, TReadonly>
```
- `TEntity`: Full entity type (all fields including system)
- `TEditable`: Pick of fields the role can write
- `TReadonly`: Pick of fields the role can only read (non-system)
