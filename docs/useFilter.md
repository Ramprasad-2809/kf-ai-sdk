# useFilter Hook Documentation

The `useFilter` hook provides a powerful interface for building and managing complex filter conditions.

## Table of Contents

- [Type Reference](#type-reference)
- [Usage Example](#usage-example)
- [Operator Reference](#operator-reference)

## Type Reference

### Import Types

```typescript
import { useFilter } from "@ram_28/kf-ai-sdk";
import type {
  UseFilterOptions,
  UseFilterReturn,
  FilterConditionWithId,
  ValidationError,
  LogicalOperator,
  FilterOperator,
} from "@ram_28/kf-ai-sdk";
```

### FilterOperator

Operators for filter conditions.

```typescript
type FilterOperator =
  | "EQ"          // Equal
  | "NE"          // Not equal
  | "GT"          // Greater than
  | "GTE"         // Greater than or equal
  | "LT"          // Less than
  | "LTE"         // Less than or equal
  | "Between"     // Between two values (array of 2)
  | "NotBetween"  // Not between two values
  | "IN"          // In list
  | "NIN"         // Not in list
  | "Empty"       // Null or empty
  | "NotEmpty"    // Not null/empty
  | "Contains"    // String contains
  | "NotContains";// String does not contain
```

### LogicalOperator

Operators for combining conditions.

```typescript
type LogicalOperator = "And" | "Or" | "Not";
```

### FilterConditionWithId

Internal condition with ID for state management. Returned by `filter.conditions` and `filter.getCondition()`.

```typescript
interface FilterConditionWithId {
  id: string;
  operator: FilterOperator | LogicalOperator;
  lhsField?: string;
  rhsValue?: any;
  rhsType?: "Constant" | "BOField" | "AppVariable";
  children?: FilterConditionWithId[];
  isValid: boolean;
  validationErrors?: string[];
}
```

### ValidationError

Error information for invalid conditions.

```typescript
interface ValidationError {
  conditionId: string;
  field: string;
  message: string;
}
```

### UseFilterOptions<T>

```typescript
interface UseFilterOptions<T> {
  initialConditions?: FilterConditionWithId[];
  initialLogicalOperator?: LogicalOperator;
  validateOnChange?: boolean;
  onConditionAdd?: (condition: FilterConditionWithId) => void;
  onConditionUpdate?: (condition: FilterConditionWithId) => void;
  onConditionRemove?: (conditionId: string) => void;
  onValidationError?: (errors: ValidationError[]) => void;
}
```

### UseFilterReturn<T>

```typescript
interface UseFilterReturn<T> {
  // State
  conditions: FilterConditionWithId[];
  logicalOperator: LogicalOperator;
  isValid: boolean;
  validationErrors: ValidationError[];
  hasConditions: boolean;

  // Condition Management
  addCondition: (condition: Omit<FilterConditionWithId, "id" | "isValid">) => string;
  updateCondition: (id: string, updates: Partial<FilterConditionWithId>) => boolean;
  removeCondition: (id: string) => boolean;
  clearConditions: () => void;
  getCondition: (id: string) => FilterConditionWithId | undefined;
  setLogicalOperator: (operator: LogicalOperator) => void;

  // Bulk Operations
  setConditions: (conditions: FilterConditionWithId[]) => void;

  // Utilities
  getConditionCount: () => number;
  exportState: () => { logicalOperator: LogicalOperator; conditions: FilterConditionWithId[] };
  importState: (state: { logicalOperator: LogicalOperator; conditions: FilterConditionWithId[] }) => void;
}
```

## Usage Example

Filters are typically used through `useTable`. This example shows all types in action:

```tsx
import { useState } from "react";
import { useTable } from "@ram_28/kf-ai-sdk";
import type {
  FilterConditionWithId,
  ValidationError,
  LogicalOperator,
  FilterOperator,
} from "@ram_28/kf-ai-sdk";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type SellerProduct = ProductType<typeof Roles.Seller>;

export function ProductFilterPage() {
  const product = new Product(Roles.Seller);
  const [savedFilters, setSavedFilters] = useState<FilterConditionWithId[]>([]);

  const table = useTable<SellerProduct>({
    source: product._id,
    columns: [{ fieldId: "Title" }, { fieldId: "Price" }, { fieldId: "Category" }],
    enableFiltering: true,
    initialState: {
      // LogicalOperator - determines how conditions are combined
      filterOperator: "And" as LogicalOperator,
    },
    // ValidationError[] - called when filter validation fails
    onFilterError: (errors: ValidationError[]) => {
      errors.forEach((err) => {
        console.error(`Filter error on ${err.field}: ${err.message}`);
      });
    },
  });

  // Add a filter condition
  const addCategoryFilter = (category: string) => {
    table.filter.addCondition({
      operator: "EQ" as FilterOperator,  // FilterOperator - the comparison type
      lhsField: "Category",
      rhsValue: category,
    });
  };

  // FilterConditionWithId - internal representation with ID and validation state
  // Returned by filter.conditions and filter.getCondition()
  const displayActiveFilters = () => {
    const conditions: FilterConditionWithId[] = table.filter.conditions;
    return conditions.map((condition: FilterConditionWithId) => (
      <div key={condition.id}>
        <span>
          {condition.lhsField} {condition.operator} {condition.rhsValue}
        </span>
        <span>{condition.isValid ? "Valid" : "Invalid"}</span>
        {condition.validationErrors?.map((err, i) => (
          <span key={i} className="error">{err}</span>
        ))}
        <button onClick={() => table.filter.removeCondition(condition.id)}>
          Remove
        </button>
      </div>
    ));
  };

  // Get a specific condition by ID
  const getConditionDetails = (id: string) => {
    const condition: FilterConditionWithId | undefined = table.filter.getCondition(id);
    if (condition) {
      console.log(`Condition ${condition.id}: ${condition.lhsField} ${condition.operator}`);
    }
  };

  // LogicalOperator - switch between And/Or/Not
  const toggleLogic = () => {
    const current: LogicalOperator = table.filter.logicalOperator;
    const next: LogicalOperator = current === "And" ? "Or" : "And";
    table.filter.setLogicalOperator(next);
  };

  // Save/restore filter state using FilterConditionWithId[]
  const saveFilters = () => {
    setSavedFilters([...table.filter.conditions]);
  };

  const restoreFilters = () => {
    table.filter.setConditions(savedFilters);
  };

  // ValidationError[] - access current validation errors
  const showErrors = () => {
    const errors: ValidationError[] = table.filter.validationErrors;
    return errors.map((err: ValidationError) => (
      <div key={err.conditionId} className="error">
        {err.field}: {err.message}
      </div>
    ));
  };

  return (
    <div>
      {/* Filter Controls */}
      <div>
        <button onClick={() => addCategoryFilter("Electronics")}>
          Filter: Electronics
        </button>
        <button onClick={() => {
          table.filter.addCondition({
            operator: "Between",
            lhsField: "Price",
            rhsValue: [10, 100],
          });
        }}>
          Filter: $10-$100
        </button>
        <button onClick={toggleLogic}>
          Logic: {table.filter.logicalOperator}
        </button>
      </div>

      {/* Active Filters */}
      <div>
        <h3>Active Filters ({table.filter.getConditionCount()})</h3>
        {displayActiveFilters()}
        {table.filter.hasConditions && (
          <button onClick={table.filter.clearConditions}>Clear All</button>
        )}
      </div>

      {/* Validation Status */}
      <div>
        <span>Valid: {table.filter.isValid ? "Yes" : "No"}</span>
        {showErrors()}
      </div>

      {/* Save/Restore */}
      <div>
        <button onClick={saveFilters}>Save Filters</button>
        <button onClick={restoreFilters}>Restore Filters</button>
      </div>
    </div>
  );
}
```

**Type explanations:**

| Type | Purpose | Where Used |
|------|---------|------------|
| `FilterOperator` | Comparison operators like "EQ", "GT", "Contains" | `condition.operator` for leaf conditions |
| `LogicalOperator` | Combining operators: "And", "Or", "Not" | `filter.logicalOperator`, `filter.setLogicalOperator()` |
| `FilterConditionWithId` | Condition with ID and validation state | `filter.conditions`, `filter.getCondition()`, saved filters |
| `ValidationError` | Error info for invalid conditions | `filter.validationErrors`, `onFilterError` callback |

## Operator Reference

### Comparison Operators (FilterOperator)

| Operator | Description | Example rhsValue |
|----------|-------------|------------------|
| `EQ` | Equals | `"Electronics"` |
| `NE` | Not equals | `"Inactive"` |
| `GT` | Greater than | `100` |
| `GTE` | Greater than or equal | `100` |
| `LT` | Less than | `50` |
| `LTE` | Less than or equal | `50` |
| `Between` | Between two values | `[10, 100]` |
| `NotBetween` | Not between | `[10, 100]` |
| `IN` | In list | `["A", "B", "C"]` |
| `NIN` | Not in list | `["X", "Y"]` |
| `Empty` | Is null/empty | (no value needed) |
| `NotEmpty` | Is not null/empty | (no value needed) |
| `Contains` | String contains | `"search"` |
| `NotContains` | String doesn't contain | `"exclude"` |

### Logical Operators (LogicalOperator)

| Operator | Description |
|----------|-------------|
| `And` | All conditions must match |
| `Or` | Any condition can match |
| `Not` | Negate condition (single child only) |

### rhsType Options

| Type | Description |
|------|-------------|
| `"Constant"` | Direct value (default) |
| `"BOField"` | Compare to another field: `lhsField: "endDate", rhsValue: "startDate"` |
| `"AppVariable"` | Compare to app variable |
