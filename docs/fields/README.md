# Fields

Field classes are the typed metadata layer for BDO properties. 13 classes extend `BaseField<T>`, each storing raw backend meta and exposing getters + `validate()`.

## Imports

```typescript
import {
  StringField,
  NumberField,
  BooleanField,
  DateField,
  DateTimeField,
  TextField,
  SelectField,
  ReferenceField,
  UserField,
  FileField,
  ImageField,
  ArrayField,
  ObjectField,
} from "@ram_28/kf-ai-sdk/bdo";
import type {
  StringFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  TextFieldType,
  SelectFieldType,
  ReferenceFieldType,
  UserFieldType,
  FileFieldType,
  ImageFieldType,
  FileType,
  ArrayFieldType,
  ObjectFieldType,
} from "@ram_28/kf-ai-sdk/types";
```

## Common Mistakes (READ FIRST)

1. **`item.Title` is not the value** — Use `item.Title.get()` to read, `.set()` to write.
2. **Don't confuse `StringField` (class) with `StringFieldType` (type alias)** — Different modules.
3. **`fetchOptions()` requires a parent BDO** — Standalone fields will throw.
4. **SelectField meta `Type` is `"String"`** — `Constraint.Enum` differentiates it.
5. **Always use pre-built components for File/Image** — `<FileUpload>`, `<ImageUpload>`, `<FilePreview>`, `<ImageThumbnail>`.

## Quick Start

```typescript
// Declare on a BDO class
readonly Title = new StringField({
  _id: "Title", Name: "Title", Type: "String",
  Constraint: { Required: true, Length: 255 },
});

// Access metadata
bdo.Title.id;       // "Title"
bdo.Title.label;    // "Title"
bdo.Title.required; // true
bdo.Title.length;   // 255

// Read/write via Item proxy
const item = await bdo.get("abc123");
item.Title.get();      // "My Product"
item.Title.set("New"); // update

// Form binding
<input {...register(bdo.Title.id)} />
```

## BaseField Contract

All fields share these getters: `id`, `label`, `readOnly`, `required`, `defaultValue`, `primaryKey`, `meta`.

Abstract method: `validate(value: T | undefined): ValidationResultType` → `{ valid, errors }`.

## Quick Reference

| Class                  | Value Type         | Extra Getters                                     | Async            |
| ---------------------- | ------------------ | ------------------------------------------------- | ---------------- |
| `StringField`          | `string`           | `length`                                          | —                |
| `NumberField`          | `number`           | `integerPart`, `fractionPart`                     | —                |
| `BooleanField`         | `boolean`          | —                                                 | —                |
| `DateField`            | `YYYY-MM-DD`       | —                                                 | —                |
| `DateTimeField`        | ISO string         | `precision`                                       | —                |
| `TextField`            | `string`           | `format`                                          | —                |
| `SelectField<T>`       | `T`                | `options`                                         | `fetchOptions()` |
| `ReferenceField<TRef>` | `TRef`             | `referenceBdo`, `referenceFields`, `searchFields` | `fetchOptions()` |
| `UserField`            | `{ _id, _name }`   | `businessEntity`                                  | `fetchOptions()` |
| `FileField`            | `FileType[]`       | —                                                 | —                |
| `ImageField`           | `FileType \| null` | —                                                 | —                |
| `ArrayField<T>`        | `T[]`              | `elementType`                                     | —                |
| `ObjectField<T>`       | `T`                | `properties`                                      | —                |

## Form Binding Patterns

| Field Type | Pattern                                   | Key Detail                                                                     |
| ---------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| String     | `register()`                              | `maxLength={field.length}`                                                     |
| Number     | `register()` with `type="number"`         | `step` from `fractionPart` (e.g. `2` → `"0.01"`, none → `"1"`)                 |
| Boolean    | `watch()` + `setValue()`                  | Checkboxes don't fire native change — never use `register()`                   |
| Date       | `register()` with `type="date"`           | Strict `YYYY-MM-DD` — never default to `""`                                    |
| DateTime   | `register()` with `type="datetime-local"` | `step="0.001"` for `"Millisecond"` precision — never default to `""`           |
| Text       | `register()` with `<textarea>`            | Check `field.format` (`"Plain"` \| `"Markdown"`) for conditional rendering     |
| Select     | `watch()` + `setValue()`                  | Static `field.options` from `Constraint.Enum`, or dynamic via `fetchOptions()` |
| Reference  | `watch()` + `setValue()`                  | Stores **full object**, not just ID — use `<ReferenceSelect>` component        |
| User       | `watch()` + `setValue()`                  | `{ _id, _name }` shape — use `fetchOptions()` + dropdown                       |
| File       | Component only                            | `<FileUpload>` (edit) / `<FilePreview>` (read-only)                            |
| Image      | Component only                            | `<ImageUpload>` (edit) / `<ImageThumbnail>` (read-only)                        |

## fetchOptions() Pattern

SelectField, ReferenceField, and UserField share this pattern:

```tsx
const [dropdownOpen, setDropdownOpen] = useState(false);
const { data: options = [] } = useQuery({
  queryKey: ["options", bdo.meta._id, field.id, item._id],
  queryFn: () => field.fetchOptions(item._id!),
  enabled: dropdownOpen && !!item._id,
  staleTime: Infinity,
});
```

## UI Components

| Component           | Field     | Mode      | Key Props                                         |
| ------------------- | --------- | --------- | ------------------------------------------------- |
| `<ReferenceSelect>` | Reference | Edit      | `bdoField`, `instanceId`, `value`, `onChange`     |
| `<FileUpload>`      | File      | Edit      | `field`, `value`, `boId`, `instanceId`, `fieldId` |
| `<ImageUpload>`     | Image     | Edit      | `field`, `value`, `boId`, `instanceId`, `fieldId` |
| `<FilePreview>`     | File      | Read-only | `boId`, `instanceId`, `fieldId`, `value`          |
| `<ImageThumbnail>`  | Image     | Read-only | `boId`, `instanceId`, `fieldId`, `value`          |

## Further Reading

- [API Reference](./api_reference.md) — Type signatures for BaseField and all 13 classes
- [Primitive Fields](../examples/fields/primitive-fields.md) · [Complex Fields](../examples/fields/complex-fields.md)
- [BDO](../bdo/README.md) · [useBDOForm](../useBDOForm/README.md)
