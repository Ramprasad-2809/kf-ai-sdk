# Fields API Reference

```typescript
import { StringField, NumberField, BooleanField, DateField, DateTimeField,
  TextField, SelectField, ReferenceField, UserField,
  FileField, ImageField, ArrayField, ObjectField } from "@ram_28/kf-ai-sdk/bdo";
import type { BaseFieldMetaType, ValidationResultType, SelectOptionType,
  EditableFieldAccessorType, ReadonlyFieldAccessorType } from "@ram_28/kf-ai-sdk/bdo/types";
import type { StringFieldType, NumberFieldType, BooleanFieldType,
  DateFieldType, DateTimeFieldType, TextFieldType, SelectFieldType,
  ReferenceFieldType, UserFieldType, FileFieldType, ImageFieldType, FileType,
  ArrayFieldType, ObjectFieldType } from "@ram_28/kf-ai-sdk/types";
```

## BaseField\<T\>

Abstract base class for all field definitions. Constructor: `new(meta: BaseFieldMetaType)`.

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | `meta._id` |
| `label` | `string` | `meta.Name` (falls back to `id`) |
| `readOnly` | `boolean` | `meta.ReadOnly ?? false` |
| `required` | `boolean` | `meta.Constraint?.Required ?? meta.Required ?? false` |
| `defaultValue` | `unknown` | `meta.DefaultValue ?? meta.Constraint?.DefaultValue` |
| `primaryKey` | `boolean` | `meta.Constraint?.PrimaryKey ?? false` |
| `meta` | `BaseFieldMetaType` | Full raw backend meta |
| `validate()` | `(value: T \| undefined) => ValidationResultType` | Abstract — overridden per subclass |

## All Fields

| Class | Meta Type | Extra Properties | validate() |
|-------|-----------|-----------------|------------|
| `StringField` | `StringFieldMetaType` | `length: number \| undefined` | Rejects non-string |
| `NumberField` | `NumberFieldMetaType` | `integerPart: number` (default 9), `fractionPart: number \| undefined` | Rejects NaN, non-number |
| `BooleanField` | `BooleanFieldMetaType` | — | Rejects non-boolean |
| `DateField` | `DateFieldMetaType` | — | Rejects non-`YYYY-MM-DD`, invalid dates |
| `DateTimeField` | `DateTimeFieldMetaType` | `precision: "Second" \| "Millisecond"` | Rejects unparseable date strings |
| `TextField` | `TextFieldMetaType` | `format: "Plain" \| "Markdown"` | Rejects non-string |
| `SelectField<T>` | `SelectFieldMetaType` | `options: readonly SelectOptionType<T>[]` | Rejects values not in options (skipped if empty) |
| `ReferenceField<TRef>` | `ReferenceFieldMetaType` | `referenceBdo: string`, `referenceFields: readonly string[]`, `searchFields: readonly string[]` | Rejects non-object, missing `_id` |
| `UserField` | `UserFieldMetaType` | `businessEntity: string \| undefined` | Rejects non-object, missing `_id` |
| `FileField` | `FileFieldMetaType` | — | Rejects non-array, items without `_id` |
| `ImageField` | `ImageFieldMetaType` | — | Rejects non-object, missing `_id`/`FileName` |
| `ArrayField<T>` | `ArrayFieldMetaType` | `elementType: BaseFieldMetaType \| undefined` | Rejects non-array |
| `ObjectField<T>` | `ObjectFieldMetaType` | `properties: Record<string, unknown> \| undefined` | Rejects non-object, arrays |

All validate() methods accept `undefined` and `null`.

## Async Methods

| Class | Method | Signature |
|-------|--------|-----------|
| `SelectField<T>` | `fetchOptions` | `(instanceId?: string) => Promise<SelectOptionType<T>[]>` |
| `ReferenceField<TRef>` | `fetchOptions` | `(instanceId?: string) => Promise<TRef[]>` |
| `UserField` | `fetchOptions` | `(instanceId?: string) => Promise<UserFieldType[]>` |

`instanceId` defaults to `"draft"`. Requires field to be bound to a parent BDO.

## Types

### SelectOptionType\<T\>

```typescript
interface SelectOptionType<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
```

### FileType

```typescript
interface FileType {
  _id: string;
  _name: string;
  FileName: string;
  FileExtension: string;
  Size: number;
  ContentType: string;
}
```

### ValidationResultType

```typescript
interface ValidationResultType {
  valid: boolean;
  errors: string[];
}
```

### Runtime Accessor Types

```typescript
interface EditableFieldAccessorType<T> {
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  set(value: T): void;
  validate(): ValidationResultType;
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
}

// ReadonlyFieldAccessorType<T> — same but no set()
```

### Value Type Aliases

| Type | Resolves To |
|------|-------------|
| `StringFieldType` | `string` |
| `TextFieldType` | `string` |
| `NumberFieldType` | `number` |
| `BooleanFieldType` | `boolean` |
| `DateFieldType` | `YYYY-MM-DD` (template literal) |
| `DateTimeFieldType` | `YYYY-MM-DDThh:mm:ssZ` (template literal) |
| `SelectFieldType<T>` | `T` |
| `ReferenceFieldType<TRef>` | `TRef` |
| `UserFieldType` | `{ _id: string; _name: string }` |
| `ImageFieldType` | `FileType \| null` |
| `FileFieldType` | `FileType[]` |
| `ArrayFieldType<T>` | `T[]` |
| `ObjectFieldType<T>` | `T` |

### Supported File Extensions

**Image fields** — jpg, jpeg, png, gif, webp, bmp, tiff, tif, heic, heif

**File fields** — all image extensions plus: mp4, mov, avi, webm, mkv, m4v, wmv, flv, pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, zip
