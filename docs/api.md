# API Types Reference

Request and response types for all BDO methods, grouped by method.

For the BDO pattern, field classes, and `ItemType` accessor documentation, see [bdo.md](bdo.md).

---

## Read Operations

### get

Fetches a single record by ID.

```typescript
async get(id: string): Promise<ItemType<TEditable, TReadonly>>
```

**Request:** `id: string`

**Response:** [`ItemType<TEditable, TReadonly>`](bdo.md#itemtype--runtime-accessor-pattern) — Proxy-wrapped record with field accessors.

---

### list

Fetches paginated records with optional filtering, sorting, and pagination.

```typescript
async list(options?: ListOptionsType): Promise<ItemType<TEditable, TReadonly>[]>
```

**Request:**

```typescript
interface ListOptionsType {
  // Specific fields to return (omit for all fields)
  Field?: string[];

  // Filter criteria
  Filter?: FilterType;

  // Sort configuration: [{ "fieldName": "ASC" | "DESC" }]
  Sort?: SortType;

  // Page number (1-indexed, default: 1)
  Page?: number;

  // Records per page (default: 10)
  PageSize?: number;
}
```

**Response:** [`ItemType<TEditable, TReadonly>[]`](bdo.md#itemtype--runtime-accessor-pattern) — Array of Proxy-wrapped records.

> **Search:** Use a `Filter` with the `Contains` operator on the desired field. See [useFilter docs](useFilter.md).

---

### count

Returns the count of records matching filter criteria.

```typescript
async count(options?: ListOptionsType): Promise<number>
```

**Request:** `ListOptionsType` (same as [list](#list))

**Response:** `number` — count returned directly (internally unwraps `{ Count: number }`).

---

## Write Operations

### create

Creates a new record.

```typescript
async create(data: Partial<TEditable>): Promise<ItemType<TEditable, TReadonly>>
```

**Request:** `Partial<TEditable>` — field values for the new record.

**Response:** [`ItemType<TEditable, TReadonly>`](bdo.md#itemtype--runtime-accessor-pattern) — the created record with `_id` from the API and input data as field accessors.

---

### update

Updates an existing record.

```typescript
async update(id: string, data: Partial<TEditable>): Promise<CreateUpdateResponseType>
```

**Request:** `id: string`, `data: Partial<TEditable>`

**Response:**

```typescript
interface CreateUpdateResponseType {
  _id: string;
}
```

---

### delete

Deletes a record by ID.

```typescript
async delete(id: string): Promise<DeleteResponseType>
```

**Request:** `id: string`

**Response:**

```typescript
interface DeleteResponseType {
  status: "success";
}
```

---

## Draft Operations

### draft

Previews computed field values for a new record without saving.

```typescript
async draft(data: Partial<TEditable>): Promise<DraftResponseType>
```

**Request:** `Partial<TEditable>` — field values to compute against.

**Response:**

```typescript
interface DraftResponseType {
  // Keys are field names, values are server-computed results
  [fieldName: string]: any;
}
```

---

### draftPatch

Previews computed field values for an existing record being edited.

```typescript
async draftPatch(id: string, data: Partial<TEditable>): Promise<DraftResponseType>
```

**Request:** `id: string`, `data: Partial<TEditable>`

**Response:** `DraftResponseType` (same as [draft](#draft))

---

### draftInteraction

Creates/updates a draft without requiring an instance ID. Returns computed fields along with a temporary `_id`.

```typescript
async draftInteraction(data: Partial<TEditable>): Promise<DraftResponseType & { _id: string }>
```

**Request:** `Partial<TEditable>`

**Response:** `DraftResponseType & { _id: string }` — computed fields plus a temporary draft ID.

---

## Analytics Operations

### metric

Performs aggregation queries on records.

```typescript
async metric(options: Omit<MetricOptionsType, "Type">): Promise<MetricResponseType>
```

> `Type` is added internally — pass only `GroupBy`, `Metric`, and optional `Filter`.

**Request:**

```typescript
interface MetricOptionsType {
  Type: "Metric";    // added internally
  GroupBy: string[]; // fields to group by (empty array for totals)
  Metric: MetricFieldType[];
  Filter?: FilterType;
}

interface MetricFieldType {
  Field: string;
  Type: AggregationType;
}
```

**Response:**

```typescript
interface MetricResponseType {
  // Keys follow pattern: {type}_{Field}
  // e.g., "count__id", "sum_Stock", "avg_Price"
  Data: Record<string, any>[];
}
```

**Response key pattern:** `{lowercase_type}_{Field}` — e.g., `{ Field: "Stock", Type: "Sum" }` produces key `"sum_Stock"`.

---

### pivot

Creates pivot table aggregations with row and column dimensions.

```typescript
async pivot(options: Omit<PivotOptionsType, "Type">): Promise<PivotResponseType>
```

> `Type` is added internally — pass only `Row`, `Column`, `Metric`, and optional `Filter`.

**Request:**

```typescript
interface PivotOptionsType {
  Type: "Pivot";     // added internally
  Row: string[];     // row dimension fields
  Column: string[];  // column dimension fields
  Metric: MetricFieldType[];
  Filter?: FilterType;
}
```

**Response:**

```typescript
interface PivotResponseType {
  Data: {
    RowHeader: PivotHeaderItemType[];
    ColumnHeader: PivotHeaderItemType[];
    Value: (number | string | null)[][]; // [row][column]
  };
}

interface PivotHeaderItemType {
  Key: string;
  Children?: PivotHeaderItemType[];
}
```

---

## Shared Types

### FilterType

```typescript
type FilterType = ConditionGroupType;

interface ConditionGroupType {
  Operator: "And" | "Or" | "Not";
  Condition: Array<ConditionType | ConditionGroupType>;
}

interface ConditionType {
  Operator: ConditionOperatorType;
  LHSField: string;
  RHSValue: any;
  RHSType?: "Constant" | "BDOField" | "AppVariable";
}
```

**Condition Operators:** `EQ`, `NE`, `GT`, `GTE`, `LT`, `LTE`, `Between`, `NotBetween`, `IN`, `NIN`, `Empty`, `NotEmpty`, `Contains`, `NotContains`, `MinLength`, `MaxLength`

For full filter documentation, see the [useFilter docs](useFilter.md).

### SortType

```typescript
type SortType = Record<string, "ASC" | "DESC">[];
```

Format: `[{ "fieldName": "ASC" }, { "anotherField": "DESC" }]`

### AggregationType

```typescript
type AggregationType =
  | "Sum" | "Avg" | "Count" | "Max" | "Min"
  | "DistinctCount" | "BlankCount" | "NotBlankCount"
  | "Concat" | "DistinctConcat";
```
