# API Types Reference

Request and response types for BDO methods. For usage patterns, see [bdo.md](bdo.md).

## Imports

```typescript
import { api } from "@ram_28/kf-ai-sdk/api";
import type { ListOptionsType, CreateUpdateResponseType, DeleteResponseType, DraftResponseType, MetricOptionsType, MetricResponseType, PivotOptionsType, PivotResponseType } from "@ram_28/kf-ai-sdk/api/types";
```

---

## Common Mistakes (READ FIRST)

### 1. Calling `api` directly instead of as factory

```typescript
// ❌ WRONG — api is a function, not a client
api.get(id);  api.delete(id);

// ✅ CORRECT — call api(boId) first
api(bdo.meta._id).get(id);
api(bdo.meta._id).delete(id);
```

### 2. Using `api()` when BDO methods are available

Prefer BDO methods when they're `public` on the role's class. Use `api()` only for `protected` methods.

```typescript
// ✅ PREFERRED — BDO method
const items = await bdo.list();

// ✅ USE api() ONLY when BDO method is protected
await api(bdo.meta._id).delete(id);
```

### 3. Wrong metric response key format

Key pattern is `{lowercase_type}_{Field}` with single underscore.

```typescript
// ❌ WRONG
const count = result.Data[0].count;

// ✅ CORRECT
const count = result.Data?.[0]?.["count__id"] ?? 0;     // Count of _id
const total = result.Data?.[0]?.["sum_unit_price"] ?? 0; // Sum of unit_price
```

---

## Response Types

```typescript
interface CreateUpdateResponseType { _id: string; }
interface DeleteResponseType { status: "success"; }
interface DraftResponseType { [fieldName: string]: any; }

interface ListOptionsType {
  Field?: string[];
  Filter?: FilterType;
  Sort?: Record<string, "ASC" | "DESC">[];
  Page?: number;       // 1-indexed
  PageSize?: number;   // Default: 10
}

interface MetricOptionsType {
  GroupBy: string[];
  Metric: { Field: string; Type: AggregationType; }[];
  Filter?: FilterType;
}

interface MetricResponseType { Data: Record<string, any>[]; }

interface PivotOptionsType {
  Row: string[];
  Column: string[];
  Metric: { Field: string; Type: AggregationType; }[];
  Filter?: FilterType;
}

interface PivotResponseType {
  Data: { RowHeader: { Key: string }[]; ColumnHeader: { Key: string }[]; Value: (number | string | null)[][]; };
}

type AggregationType = "Sum" | "Avg" | "Count" | "Max" | "Min" | "DistinctCount" | "BlankCount" | "NotBlankCount" | "Concat" | "DistinctConcat";

// Filter type (for bdo.list() Filter parameter)
interface FilterType { Operator: "And" | "Or" | "Not"; Condition: Array<ConditionType | ConditionGroupType>; }
interface ConditionType { Operator: string; LHSField: string; RHSValue: any; RHSType?: "Constant" | "BDOField" | "AppVariable"; }

type SortType = Record<string, "ASC" | "DESC">[];
```
