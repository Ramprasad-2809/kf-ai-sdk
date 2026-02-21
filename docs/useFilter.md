# Filter SDK API

React hook for building filter conditions for tables, forms, and API calls.

## Imports

```typescript
import { useFilter, isCondition, isConditionGroup, ConditionOperator, GroupOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
import type { UseFilterOptionsType, UseFilterReturnType, ConditionType, ConditionGroupType, FilterType } from "@ram_28/kf-ai-sdk/filter/types";
```

---

## Common Mistakes (READ FIRST)

### 1. Importing `RHSType` instead of `FilterValueSource`

There is NO named export `RHSType`. Import `FilterValueSource`. The JSON key IS called `RHSType`, but the value comes from `FilterValueSource`.

```typescript
// ❌ WRONG — RHSType is not an importable enum
import { RHSType } from "@ram_28/kf-ai-sdk/filter";

// ✅ CORRECT
import { FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
{ RHSType: FilterValueSource.Constant }
```

### 2. Wrong field name casing in ConditionType

`ConditionType` uses **PascalCase**: `Operator`, `LHSField`, `RHSValue`, `RHSType`. NOT camelCase.

```typescript
// ❌ WRONG — camelCase
{ operator: "EQ", lhsField: "status", rhsValue: "Active" }

// ✅ CORRECT — PascalCase
{ Operator: ConditionOperator.EQ, LHSField: bdo.status.id, RHSValue: "Active", RHSType: FilterValueSource.Constant }
```

### 3. Mixing hook init format with API format

Hook init (`UseFilterOptionsType`) uses lowercase `conditions`/`operator`. API format (`FilterType`/`ConditionType`) uses uppercase `Condition`/`Operator`.

```typescript
// Hook initialization — lowercase
useTable({ initialState: { filter: { conditions: [...], operator: "And" } } });

// API calls — uppercase
bdo.list({ Filter: { Operator: "And", Condition: [...] } });
```

### 4. Hardcoded operator strings

ALWAYS use `ConditionOperator` constants. NEVER write `"Equals"`, `"equals"`, or `"eq"`.

```typescript
// ❌ WRONG
{ Operator: "Equals" }  { Operator: "equals" }  { Operator: "eq" }

// ✅ CORRECT
{ Operator: ConditionOperator.EQ }    // "EQ"
{ Operator: ConditionOperator.Contains }  // "Contains"
```

### 5. Accessing `filter.conditions` instead of `filter.items`

```typescript
// ❌ WRONG — conditions does NOT exist
filter.conditions.length

// ✅ CORRECT
filter.items.length
filter.hasConditions  // boolean shortcut
```

### 6. Using `as const` on Operator values

```typescript
// ❌ WRONG — causes narrowing errors in arrays
[{ Operator: ConditionOperator.EQ as const, ... }]

// ✅ CORRECT — type the array
const conditions: Omit<ConditionType, "id">[] = [{ Operator: ConditionOperator.EQ, ... }];
```

---

## Constants

```typescript
// Condition operators
ConditionOperator.EQ  ConditionOperator.NE       // Equal, Not Equal
ConditionOperator.GT  ConditionOperator.GTE      // Greater Than (or Equal)
ConditionOperator.LT  ConditionOperator.LTE      // Less Than (or Equal)
ConditionOperator.Contains  ConditionOperator.NotContains  // String contains
ConditionOperator.IN  ConditionOperator.NIN       // Value in/not-in list
ConditionOperator.Empty  ConditionOperator.NotEmpty  // Null/empty check
ConditionOperator.Between  ConditionOperator.NotBetween  // Range

// Group operators
GroupOperator.And  GroupOperator.Or  GroupOperator.Not

// RHS value source (KEY is "RHSType", VALUE from FilterValueSource)
FilterValueSource.Constant     // "Constant" — literal value
FilterValueSource.BDOField     // "BDOField" — compare against another field
FilterValueSource.AppVariable  // "AppVariable" — app variable
```

---

## Type Definitions

```typescript
interface ConditionType<T = any> {
  id?: string;                           // Auto-generated
  Operator: ConditionOperatorType;       // PascalCase
  LHSField: keyof T | string;
  RHSValue: any;
  RHSType?: "Constant" | "BDOField" | "AppVariable";
}

interface ConditionGroupType<T = any> {
  id?: string;
  Operator: "And" | "Or" | "Not";
  Condition: Array<ConditionType<T> | ConditionGroupType<T>>;
}

interface UseFilterOptionsType<T = any> {    // lowercase — hook init
  conditions?: Array<ConditionType<T> | ConditionGroupType<T>>;
  operator?: "And" | "Or" | "Not";
}

interface UseFilterReturnType<T = any> {
  operator: "And" | "Or" | "Not";
  items: Array<ConditionType<T> | ConditionGroupType<T>>;
  payload: FilterType<T> | undefined;     // API-ready, undefined if empty
  hasConditions: boolean;
  addCondition: (condition: Omit<ConditionType<T>, "id">, parentId?: string) => string;
  addConditionGroup: (operator: "And" | "Or" | "Not", parentId?: string) => string;
  updateCondition: (id: string, updates: Partial<Omit<ConditionType<T>, "id">>) => void;
  removeCondition: (id: string) => void;
  clearAllConditions: () => void;
  setRootOperator: (op: "And" | "Or" | "Not") => void;
}
```

---

## Usage Example

```tsx
import { useFilter, ConditionOperator, GroupOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
import type { UseFilterOptionsType } from "@ram_28/kf-ai-sdk/filter/types";

// Standalone filter
const filter = useFilter<AdminProductFieldType>();
filter.addCondition({ Operator: ConditionOperator.EQ, LHSField: bdo.status.id, RHSValue: "Active", RHSType: FilterValueSource.Constant });
filter.addCondition({ Operator: ConditionOperator.GT, LHSField: bdo.unit_price.id, RHSValue: 100, RHSType: FilterValueSource.Constant });

// With useTable initialState
const table = useTable<AdminProductFieldType>({
  source: bdo.meta._id,
  columns,
  initialState: {
    filter: {
      conditions: [
        { Operator: ConditionOperator.EQ, LHSField: "_created_by", RHSValue: user._id, RHSType: FilterValueSource.Constant },
      ],
      operator: GroupOperator.And,
    },
  },
});

// Dynamic filter with useEffect
useEffect(() => {
  table.filter.clearAllConditions();
  if (status !== "all") {
    table.filter.addCondition({ Operator: ConditionOperator.EQ, LHSField: bdo.status.id, RHSValue: status, RHSType: FilterValueSource.Constant });
  }
}, [status]);

// Nested: Category = "Electronics" AND (Price < 100 OR OnSale = true)
filter.addCondition({ Operator: ConditionOperator.EQ, LHSField: bdo.category.id, RHSValue: "Electronics", RHSType: FilterValueSource.Constant });
const orGroupId = filter.addConditionGroup(GroupOperator.Or);
filter.addCondition({ Operator: ConditionOperator.LT, LHSField: bdo.price.id, RHSValue: 100, RHSType: FilterValueSource.Constant }, orGroupId);
filter.addCondition({ Operator: ConditionOperator.EQ, LHSField: bdo.on_sale.id, RHSValue: true, RHSType: FilterValueSource.Constant }, orGroupId);
```
