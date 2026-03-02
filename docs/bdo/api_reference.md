```typescript
import { BaseBdo, StringField, NumberField, BooleanField, DateField, SelectField, ReferenceField } from "@ram_28/kf-ai-sdk/bdo";
import type {
  ItemType,
  EditableFieldAccessorType,
  ReadonlyFieldAccessorType,
  ValidationResultType,
  BdoMetaType,
} from "@ram_28/kf-ai-sdk/bdo/types";
import type {
  ListOptionsType,
  FilterType,
  ConditionGroupType,
  ConditionType,
  SortType,
  CreateUpdateResponseType,
  DeleteResponseType,
  MetricOptionsType,
  MetricResponseType,
  PivotOptionsType,
  PivotResponseType,
} from "@ram_28/kf-ai-sdk/api/types";
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
  ArrayFieldType,
  ObjectFieldType,
  SystemFieldsType,
} from "@ram_28/kf-ai-sdk/types";
```

## Methods

All methods are `protected` on `BaseBdo`. Subclasses expose them as `public` per role.

| Method | Params | Returns |
|--------|--------|---------|
| `get(id)` | `id: string` | `Promise<ItemType<TEditable, TReadonly>>` |
| `list(options?)` | `options?: ListOptionsType` | `Promise<ItemType<TEditable, TReadonly>[]>` |
| `count(options?)` | `options?: ListOptionsType` | `Promise<number>` |
| `create(data)` | `data: Partial<TEditable>` | `Promise<ItemType<TEditable, TReadonly>>` |
| `update(id, data)` | `id: string, data: Partial<TEditable>` | `Promise<CreateUpdateResponseType>` |
| `delete(id)` | `id: string` | `Promise<DeleteResponseType>` |
| `metric(options)` | `options: Omit<MetricOptionsType, "Type">` | `Promise<MetricResponseType>` |
| `pivot(options)` | `options: Omit<PivotOptionsType, "Type">` | `Promise<PivotResponseType>` |

## Types

### ItemType\<TEditable, TReadonly\>

Proxy-wrapped record returned by `get()`, `list()`, and `create()`. Provides typed field accessors for each field.

```typescript
type ItemType<TEditable, TReadonly> = {
  readonly _id: string;               // direct string access

  // Editable fields → EditableFieldAccessorType<T>
  // Readonly fields → ReadonlyFieldAccessorType<T>

  validate(): ValidationResultType;   // validates all fields
  toJSON(): Partial<TEditable & TReadonly>;
};
```

### EditableFieldAccessorType\<T\>

Accessor for fields the current role can write.

```typescript
interface EditableFieldAccessorType<T> {
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  set(value: T): void;
  validate(): ValidationResultType;
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: false;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
}
```

### ReadonlyFieldAccessorType\<T\>

Accessor for fields the current role can only read. Same as editable but no `set()`.

```typescript
interface ReadonlyFieldAccessorType<T> {
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  validate(): ValidationResultType;
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: true;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
}
```

### ValidationResultType

```typescript
interface ValidationResultType {
  valid: boolean;
  errors: string[];
}
```

### ListOptionsType

```typescript
interface ListOptionsType {
  Filter?: FilterType;
  Sort?: SortType;
  Page?: number;       // 1-indexed
  PageSize?: number;
  Search?: string;
  Field?: string[];    // specific fields to return
}
```

### FilterType / ConditionGroupType / ConditionType

```typescript
// Root filter — alias for ConditionGroupType
type FilterType = ConditionGroupType;

interface ConditionGroupType {
  Operator: "And" | "Or" | "Not";
  Condition: Array<ConditionType | ConditionGroupType>;
}

interface ConditionType {
  Operator: string;        // "EQ", "NE", "GT", "GTE", "LT", "LTE", "Contains", "StartsWith", "IN", "NIN", "Empty", "NotEmpty"
  LHSField: string;        // field name
  RHSValue: any;            // comparison value
  RHSType?: string;         // defaults to "Constant"
}
```

### SortType

```typescript
type SortType = Record<string, "ASC" | "DESC">[];
// Example: [{ "Price": "DESC" }, { "Title": "ASC" }]
```

### CreateUpdateResponseType

```typescript
interface CreateUpdateResponseType {
  _id: string;
}
```

### DeleteResponseType

```typescript
interface DeleteResponseType {
  status: string;
}
```

### MetricOptionsType

Omit `Type` when calling `bdo.metric()` — it is added automatically.

```typescript
interface MetricOptionsType {
  Type: "Metric";                  // omit when calling bdo.metric()
  GroupBy: string[];
  Metric: MetricFieldType[];
  Filter?: FilterType;
}

interface MetricFieldType {
  Field: string;
  Type: string;   // "Count" | "Sum" | "Avg" | "Max" | "Min"
}
```

### MetricResponseType

```typescript
interface MetricResponseType {
  Data: Record<string, any>[];
}
```

### PivotOptionsType

Omit `Type` when calling `bdo.pivot()` — it is added automatically.

```typescript
interface PivotOptionsType {
  Type: "Pivot";                   // omit when calling bdo.pivot()
  Row: string[];
  Column: string[];
  Metric: MetricFieldType[];
  Filter?: FilterType;
}
```

### PivotResponseType

```typescript
interface PivotResponseType {
  Data: {
    RowHeader: PivotHeaderItemType[];
    ColumnHeader: PivotHeaderItemType[];
    Value: (number | string | null)[][];
  };
}

interface PivotHeaderItemType {
  Key: string;
  Children?: PivotHeaderItemType[] | null;
}
```

### SystemFieldsType

Seven system-managed fields inherited from `BaseBdo`. Never redeclare in subclasses.

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

### Field Value Types

| Type | Resolves To |
|------|-------------|
| `StringFieldType` | `string` |
| `TextFieldType` | `string` |
| `NumberFieldType` | `number` |
| `BooleanFieldType` | `boolean` |
| `DateFieldType` | `"YYYY-MM-DD"` |
| `DateTimeFieldType` | `"YYYY-MM-DDThh:mm:ssZ"` |
| `SelectFieldType<T>` | `T` |
| `ReferenceFieldType<T>` | `T` |
| `UserFieldType` | `{ _id: string; _name: string }` |
| `ImageFieldType` | `FileType \| null` |
| `FileFieldType` | `FileType[]` |
| `ArrayFieldType<T>` | `T[]` |
| `ObjectFieldType<T>` | `T` |

### Generated Type Patterns

The js_sdk generator creates these types per entity:

```typescript
// entities/Product.ts
export type ProductType = {
  ProductId: StringFieldType;
  Title: StringFieldType;
  Price: NumberFieldType;
  // ... business fields
} & SystemFieldsType;

// admin/Product.ts
type AdminProductEditableFieldType = Omit<ProductType, keyof SystemFieldsType>;
type AdminProductReadonlyFieldType = Record<string, never>;
// or Pick<ProductType, "Field1" | "Field2"> for limited access
```
