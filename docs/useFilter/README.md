# useFilter

Standalone filter state manager for building composable filter conditions with nested groups.

## When to Use

**Use `useFilter` when:**

- Building a standalone filter panel or sidebar outside of a table
- You need a composable condition tree with nested AND/OR/NOT groups
- Managing filter state that feeds into a custom data fetch

**Use something else when:**

- Filtering a BDO table — use [`useBDOTable`](../useBDOTable/README.md) (includes useFilter at `table.filter`)
- Filtering an activity table — use [`useActivityTable`](../useActivityTable/README.md) (includes useFilter at `table.filter`)

## Imports

```tsx
import { useFilter, ConditionOperator, GroupOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
import { isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";
```

## Quick Start

```tsx
import { useMemo } from "react";
import { useFilter, ConditionOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";
import { AdminProduct } from "@/bdo/admin/Product";
import type { AdminProductFieldType } from "@/bdo/admin/Product";

function ProductFilter() {
  const bdo = useMemo(() => new AdminProduct(), []);
  const filter = useFilter<AdminProductFieldType>();

  const applyStatusFilter = (status: string) => {
    filter.clearAllConditions();
    if (status !== "all") {
      filter.addCondition({
        Operator: ConditionOperator.EQ,
        LHSField: bdo.status.id,
        RHSValue: status,
        RHSType: FilterValueSource.Constant,
      });
    }
  };

  return (
    <div>
      <button onClick={() => applyStatusFilter("Active")}>Active</button>
      <button onClick={() => applyStatusFilter("all")}>All</button>
      <p>{filter.hasConditions ? "Filtering active" : "No filters"}</p>
      {filter.payload && <pre>{JSON.stringify(filter.payload, null, 2)}</pre>}
    </div>
  );
}
```

## Usage Guide

### Adding Conditions

Add leaf conditions with `addCondition()`. Each condition uses PascalCase properties: `Operator`, `LHSField`, `RHSValue`, and optionally `RHSType`. Always use constants instead of string literals.

```tsx
import { ConditionOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";

// Exact match
filter.addCondition({
  Operator: ConditionOperator.EQ,
  LHSField: bdo.category.id,
  RHSValue: "Electronics",
  RHSType: FilterValueSource.Constant,
});

// Range filter
filter.addCondition({
  Operator: ConditionOperator.Between,
  LHSField: bdo.unit_price.id,
  RHSValue: [100, 500],
  RHSType: FilterValueSource.Constant,
});

// String search
filter.addCondition({
  Operator: ConditionOperator.Contains,
  LHSField: bdo.description.id,
  RHSValue: "wireless",
  RHSType: FilterValueSource.Constant,
});
```

### Tracking and Removing by ID

`addCondition()` returns an auto-generated ID string. Store the ID to later remove or look up the condition. IDs are internal state-management artifacts -- they are stripped from `payload` automatically.

```tsx
const [statusId, setStatusId] = useState<string | null>(null);

const applyStatusFilter = (status: string) => {
  // Remove existing status condition if present
  if (statusId) {
    filter.removeCondition(statusId);
    setStatusId(null);
  }

  // Add new condition and store its ID
  if (status !== "all") {
    const id = filter.addCondition({
      Operator: ConditionOperator.EQ,
      LHSField: bdo.status.id,
      RHSValue: status,
      RHSType: FilterValueSource.Constant,
    });
    setStatusId(id);
  }
};
```

### Updating Conditions

Update a leaf condition's properties without removing and re-adding it. Use `updateCondition()` for leaf conditions and `updateGroupOperator()` for groups:

```tsx
// Change the comparison value on an existing condition
filter.updateCondition(conditionId, {
  RHSValue: "Books",
});

// Change a group's operator from And to Or
filter.updateGroupOperator(groupId, GroupOperator.Or);
```

### Nested Groups

Build arbitrarily deep condition trees using `addConditionGroup()`. Pass a `parentId` to nest groups inside other groups, and pass a `parentId` to `addCondition()` to add leaf conditions inside a group.

This example constructs: `Status = "Active" AND (Category = "Electronics" AND Price < 500) OR (Category = "Books" AND Price < 50)`:

```tsx
import { useFilter, ConditionOperator, GroupOperator, FilterValueSource } from "@ram_28/kf-ai-sdk/filter";

const filter = useFilter<AdminProductFieldType>();

// Root-level condition
filter.addCondition({
  Operator: ConditionOperator.EQ,
  LHSField: bdo.status.id,
  RHSValue: "Active",
  RHSType: FilterValueSource.Constant,
});

// Create an OR group at root level -- capture its ID
const orGroupId = filter.addConditionGroup(GroupOperator.Or);

// Nest an AND group inside the OR group for Electronics
const electronicsGroupId = filter.addConditionGroup(GroupOperator.And, orGroupId);
filter.addCondition(
  {
    Operator: ConditionOperator.EQ,
    LHSField: bdo.category.id,
    RHSValue: "Electronics",
    RHSType: FilterValueSource.Constant,
  },
  electronicsGroupId
);
filter.addCondition(
  {
    Operator: ConditionOperator.LT,
    LHSField: bdo.unit_price.id,
    RHSValue: 500,
    RHSType: FilterValueSource.Constant,
  },
  electronicsGroupId
);

// Nest another AND group inside the OR group for Books
const booksGroupId = filter.addConditionGroup(GroupOperator.And, orGroupId);
filter.addCondition(
  {
    Operator: ConditionOperator.EQ,
    LHSField: bdo.category.id,
    RHSValue: "Books",
    RHSType: FilterValueSource.Constant,
  },
  booksGroupId
);
filter.addCondition(
  {
    Operator: ConditionOperator.LT,
    LHSField: bdo.unit_price.id,
    RHSValue: 50,
    RHSType: FilterValueSource.Constant,
  },
  booksGroupId
);

// Resulting payload:
// {
//   Operator: "And",
//   Condition: [
//     { Operator: "EQ", LHSField: "status", RHSValue: "Active", RHSType: "Constant" },
//     {
//       Operator: "Or",
//       Condition: [
//         {
//           Operator: "And",
//           Condition: [
//             { Operator: "EQ", LHSField: "category", RHSValue: "Electronics", RHSType: "Constant" },
//             { Operator: "LT", LHSField: "unit_price", RHSValue: 500, RHSType: "Constant" },
//           ],
//         },
//         {
//           Operator: "And",
//           Condition: [
//             { Operator: "EQ", LHSField: "category", RHSValue: "Books", RHSType: "Constant" },
//             { Operator: "LT", LHSField: "unit_price", RHSValue: 50, RHSType: "Constant" },
//           ],
//         },
//       ],
//     },
//   ],
// }
```

### Root Operator

The root operator combines all top-level conditions. It defaults to `"And"` and can be set via the `operator` option or changed later with `setRootOperator()`:

```tsx
// Set at initialization
const filter = useFilter<AdminProductFieldType>({
  operator: "Or",
});

// Toggle between And and Or
const toggleOperator = () => {
  const next = filter.operator === GroupOperator.And ? GroupOperator.Or : GroupOperator.And;
  filter.setRootOperator(next);
};
```

### Reading State

- **`items`** -- current conditions with IDs populated (use for UI rendering)
- **`payload`** -- API-ready `FilterType` with IDs stripped. `undefined` when no conditions exist.
- **`hasConditions`** -- convenience boolean (`items.length > 0`)
- **`operator`** -- current root operator (`"And"`, `"Or"`, or `"Not"`)

Guard with a falsy check before sending the payload:

```tsx
if (filter.payload) {
  const results = await bdo.list({ Filter: filter.payload });
}
```

### Integration with Table Hooks

`useBDOTable` and `useActivityTable` embed a `useFilter` instance at `table.filter`. The API is identical -- `table.filter.addCondition()`, `table.filter.clearAllConditions()`, etc.

```tsx
const table = useBDOTable({
  bdo: product,
  initialState: {
    filter: {
      conditions: [
        { Operator: ConditionOperator.EQ, LHSField: "status", RHSValue: "Active" },
      ],
      operator: "And",
    },
  },
});

// Same API as standalone useFilter
table.filter.addCondition({ ... });
table.filter.clearAllConditions();
```

- Filter changes automatically reset table pagination to page 1.
- See [`useBDOTable`](../useBDOTable/README.md) and [`useActivityTable`](../useActivityTable/README.md) for full table documentation.

### Iterating with Type Guards

Use `isCondition()` and `isConditionGroup()` to distinguish between leaf conditions and groups when rendering the filter tree:

```tsx
import { isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";

filter.items.map((item) => {
  if (isCondition(item)) {
    return (
      <li key={item.id}>
        {String(item.LHSField)} {item.Operator} {String(item.RHSValue)}
        <button onClick={() => filter.removeCondition(item.id!)}>Remove</button>
      </li>
    );
  }
  if (isConditionGroup(item)) {
    return (
      <li key={item.id}>
        {item.Operator} group ({item.Condition.length} children)
      </li>
    );
  }
  return null;
});
```

## Further Reading

- [API Reference](./api_reference.md) -- All options, return values, constants, and type definitions
- [Filtered Product Table](../examples/bdo/filtered-product-table.md) -- BDO table with category + price range filters
- [Filtered Activity Table](../examples/workflow/filtered-activity-table.md) -- Activity table with date range filter

## Common Mistakes

- **Don't read `filter.conditions`** -- the property is `filter.items`.
- **Don't expect `payload` to be an empty object when empty** -- it's `undefined`. Use a simple falsy check: `if (filter.payload) { ... }`.
- **Don't use string literals** -- use `ConditionOperator.EQ`, `GroupOperator.And`, `FilterValueSource.Constant` instead.
- **Don't expect IDs in `payload`** -- they're stripped automatically before the payload is built.
- **Don't mix PascalCase and camelCase** -- condition properties are PascalCase (`Operator`, `LHSField`, `RHSValue`, `RHSType`), while hook options are camelCase (`conditions`, `operator`).
