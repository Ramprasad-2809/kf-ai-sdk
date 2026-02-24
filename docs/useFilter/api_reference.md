# useFilter API Reference

```tsx
import { useFilter, ConditionOperator, GroupOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
import { isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";
import type {
  UseFilterOptionsType,
  UseFilterReturnType,
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  FilterRHSType,
} from "@ram_28/kf-ai-sdk/filter/types";
import type { ConditionOperatorType } from "@ram_28/kf-ai-sdk/api/types";
```

## Signature

```tsx
const filter: UseFilterReturnType<T> = useFilter<T>(options: UseFilterOptionsType<T>);
```

## Options

`UseFilterOptionsType<T>`

- `conditions?: Array<ConditionType<T> | ConditionGroupType<T>>`
  - **Optional**, defaults to `[]`
  - Initial filter conditions. Each item is cloned and assigned an auto-generated `id`.
- `operator?: ConditionGroupOperatorType`
  - **Optional**, defaults to `"And"`
  - Root operator for combining top-level conditions.

## Return Value

`UseFilterReturnType<T>`

### State

- `operator: ConditionGroupOperatorType`
  - Current root operator (`"And"` | `"Or"` | `"Not"`).
- `items: Array<ConditionType<T> | ConditionGroupType<T>>`
  - Current filter items with `id` populated. This is the stateful tree used for rendering and lookups.
- `payload: FilterType<T> | undefined`
  - API-ready filter payload with all `id` fields stripped. Returns `undefined` when there are no conditions.
- `hasConditions: boolean`
  - `true` when at least one condition exists. Equivalent to `items.length > 0`.

### Add Operations

Both methods return the `id` (string) of the newly created item.

- `addCondition(condition: Omit<ConditionType<T>, "id">, parentId?: string): string`
  - Add a leaf condition. When `parentId` is omitted, appended at root level. When provided, added inside the matching group's `Condition` array. Returns the auto-generated `id`.
- `addConditionGroup(operator: ConditionGroupOperatorType, parentId?: string): string`
  - Create an empty condition group with the given operator. Same `parentId` behavior as `addCondition`. Returns the group's `id`.

### Update Operations

- `updateCondition(id: string, updates: Partial<Omit<ConditionType<T>, "id">>): void`
  - Partially update a leaf condition by `id`. Only provided fields are merged. No effect if `id` matches a group.
- `updateGroupOperator(id: string, operator: ConditionGroupOperatorType): void`
  - Change the `Operator` of a condition group by `id`. No effect if `id` matches a leaf condition.

### Remove & Access

- `removeCondition(id: string): void`
  - Remove a condition or group by `id`. Searches recursively. Removing a group removes all its children.
- `getCondition(id: string): ConditionType<T> | ConditionGroupType<T> | undefined`
  - Look up a condition or group by `id`. Returns `undefined` if not found. Searches recursively.

### Utility

- `clearAllConditions(): void`
  - Remove all conditions and groups, resetting `items` to `[]`. After this, `payload` is `undefined` and `hasConditions` is `false`.
- `setRootOperator(op: ConditionGroupOperatorType): void`
  - Change the root-level operator that combines all top-level conditions.

## Exported Constants

### ConditionOperator

Import from `@ram_28/kf-ai-sdk/filter`. Used as the `Operator` value on leaf conditions (`ConditionType`).

**Comparison:**

- `EQ` (`"EQ"`) -- Equal. RHSValue: single value.
- `NE` (`"NE"`) -- Not equal. RHSValue: single value.
- `GT` (`"GT"`) -- Greater than. RHSValue: single value.
- `GTE` (`"GTE"`) -- Greater than or equal. RHSValue: single value.
- `LT` (`"LT"`) -- Less than. RHSValue: single value.
- `LTE` (`"LTE"`) -- Less than or equal. RHSValue: single value.

**Range:**

- `Between` (`"Between"`) -- Value within range. RHSValue: `[min, max]`.
- `NotBetween` (`"NotBetween"`) -- Value outside range. RHSValue: `[min, max]`.

**List:**

- `IN` (`"IN"`) -- Value in list. RHSValue: `[value1, value2, ...]`.
- `NIN` (`"NIN"`) -- Value not in list. RHSValue: `[value1, value2, ...]`.

**Presence:**

- `Empty` (`"Empty"`) -- Field is empty/null. RHSValue: not required.
- `NotEmpty` (`"NotEmpty"`) -- Field is not empty. RHSValue: not required.

**String:**

- `Contains` (`"Contains"`) -- String contains substring. RHSValue: string.
- `NotContains` (`"NotContains"`) -- Does not contain. RHSValue: string.

**Length:**

- `MinLength` (`"MinLength"`) -- Minimum length. RHSValue: number.
- `MaxLength` (`"MaxLength"`) -- Maximum length. RHSValue: number.
- `Length` (`"Length"`) -- Exact length. RHSValue: number.

### GroupOperator

Import from `@ram_28/kf-ai-sdk/filter`. Used as the `Operator` value on condition groups (`ConditionGroupType`).

- `And` (`"And"`) -- All conditions must match.
- `Or` (`"Or"`) -- Any condition can match.
- `Not` (`"Not"`) -- Negate the conditions.

### FilterValueSource

Import from `@ram_28/kf-ai-sdk/filter`. Used as the `RHSType` value on leaf conditions. The import name is `FilterValueSource`; the property name on the condition object is `RHSType`.

- `Constant` (`"Constant"`) -- RHSValue is a literal value (string, number, boolean, array, etc.).
- `BDOField` (`"BDOField"`) -- RHSValue is another field name (field-to-field comparison).
- `AppVariable` (`"AppVariable"`) -- RHSValue is an application-level variable.

## Type Guards

Import from `@ram_28/kf-ai-sdk/filter`.

- `isCondition(item): item is ConditionType` -- Returns `true` when the item has an `LHSField` property (leaf condition).
- `isConditionGroup(item): item is ConditionGroupType` -- Returns `true` when the item has a `Condition` property (group node).

```tsx
filter.items.forEach((item) => {
  if (isCondition(item)) {
    console.log(item.LHSField, item.Operator, item.RHSValue);
  }
  if (isConditionGroup(item)) {
    console.log(item.Operator, "group with", item.Condition.length, "children");
  }
});
```

## Types

```typescript
// ============================================================
// Condition types
// ============================================================

interface ConditionType<T = any> {
  /** Auto-generated by useFilter for state management. Stripped from payload. */
  id?: string;
  /** Comparison operator (use ConditionOperator constants). */
  Operator: ConditionOperatorType;
  /** Field name to compare. When T is provided, autocompletes to keyof T. */
  LHSField: T extends any ? keyof T | string : string;
  /** Value to compare against. Format depends on the Operator. */
  RHSValue: any;
  /** How RHSValue is interpreted. Use FilterValueSource constants. */
  RHSType?: FilterRHSType;
}

interface ConditionGroupType<T = any> {
  /** Auto-generated by useFilter for state management. Stripped from payload. */
  id?: string;
  /** Logical operator: "And", "Or", or "Not" (use GroupOperator constants). */
  Operator: ConditionGroupOperatorType;
  /** Nested conditions and/or groups. */
  Condition: Array<ConditionType<T> | ConditionGroupType<T>>;
}

/** Root filter structure sent to the API. Alias for ConditionGroupType. */
type FilterType<T = any> = ConditionGroupType<T>;

type ConditionOperatorType = (typeof ConditionOperator)[keyof typeof ConditionOperator];
// "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "Between" | "NotBetween"
// | "IN" | "NIN" | "Empty" | "NotEmpty" | "Contains" | "NotContains"
// | "MinLength" | "MaxLength" | "Length"

type ConditionGroupOperatorType = (typeof GroupOperator)[keyof typeof GroupOperator];
// "And" | "Or" | "Not"

type FilterRHSType = (typeof FilterValueSource)[keyof typeof FilterValueSource];
// "Constant" | "BDOField" | "AppVariable"

interface UseFilterOptionsType<T = any> {
  /** Initial filter conditions. Each item is cloned and assigned an auto-generated id. */
  conditions?: Array<ConditionType<T> | ConditionGroupType<T>>;
  /** Root operator for combining conditions. Defaults to "And". */
  operator?: ConditionGroupOperatorType;
}

interface UseFilterReturnType<T = any> {
  // State
  operator: ConditionGroupOperatorType;
  items: Array<ConditionType<T> | ConditionGroupType<T>>;
  payload: FilterType<T> | undefined;
  hasConditions: boolean;

  // Add (return id of created item)
  addCondition: (condition: Omit<ConditionType<T>, "id">, parentId?: string) => string;
  addConditionGroup: (operator: ConditionGroupOperatorType, parentId?: string) => string;

  // Update
  updateCondition: (id: string, updates: Partial<Omit<ConditionType<T>, "id">>) => void;
  updateGroupOperator: (id: string, operator: ConditionGroupOperatorType) => void;

  // Remove and access
  removeCondition: (id: string) => void;
  getCondition: (id: string) => ConditionType<T> | ConditionGroupType<T> | undefined;

  // Utility
  clearAllConditions: () => void;
  setRootOperator: (op: ConditionGroupOperatorType) => void;
}
```
