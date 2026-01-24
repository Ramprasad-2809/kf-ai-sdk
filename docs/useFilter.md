# useFilter

Build and manage filter conditions with support for nested groups and complex logic.

## Imports

```typescript
import { useFilter, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";
import type {
  UseFilterOptionsType,
  UseFilterReturnType,
  ConditionType,
  ConditionGroupType,
  ConditionOperatorType,
  ConditionGroupOperatorType,
  FilterType,
} from "@ram_28/kf-ai-sdk/filter/types";
```

## Type Definitions

```typescript
// Condition operators
type ConditionOperatorType =
  | "EQ" | "NE"           // Equal, Not Equal
  | "GT" | "GTE"          // Greater Than, Greater Than or Equal
  | "LT" | "LTE"          // Less Than, Less Than or Equal
  | "Between" | "NotBetween"
  | "IN" | "NIN"          // In List, Not In List
  | "Empty" | "NotEmpty"
  | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

// Group operators
type ConditionGroupOperatorType = "And" | "Or" | "Not";

// Single condition (generic for type-safe LHSField)
interface ConditionType<T = any> {
  // Auto-generated unique identifier
  id?: string;

  // Comparison operator (EQ, GT, Contains, etc.)
  Operator: ConditionOperatorType;

  // Field name to compare
  LHSField: keyof T | string;

  // Value to compare against
  RHSValue: any;

  // Value type (default: "Constant")
  RHSType?: "Constant" | "BOField" | "AppVariable";
}

// Condition group (can contain conditions or nested groups)
interface ConditionGroupType<T = any> {
  // Auto-generated unique identifier
  id?: string;

  // Group operator (And, Or, Not)
  Operator: ConditionGroupOperatorType;

  // Nested conditions or groups
  Condition: Array<ConditionType<T> | ConditionGroupType<T>>;
}

// Hook options (also used for initialState in useTable/useKanban)
interface UseFilterOptionsType<T = any> {
  // Initial conditions to populate the filter
  conditions?: Array<ConditionType<T> | ConditionGroupType<T>>;

  // Root operator for combining conditions (default: "And")
  operator?: ConditionGroupOperatorType;
}

// Hook return type (generic for type-safe field names)
interface UseFilterReturnType<T = any> {
  // ============================================================
  // STATE
  // ============================================================

  // Current root operator (And, Or, Not)
  operator: ConditionGroupOperatorType;

  // All conditions and groups at root level
  items: Array<ConditionType<T> | ConditionGroupType<T>>;

  // API-ready filter payload (undefined if no conditions)
  payload: FilterType<T> | undefined;

  // True when at least one condition exists
  hasConditions: boolean;

  // ============================================================
  // METHODS
  // ============================================================

  // Add a condition, optionally to a parent group. Returns the new condition's ID
  addCondition: (condition: Omit<ConditionType<T>, "id">, parentId?: string) => string;

  // Add a condition group, optionally to a parent group. Returns the new group's ID
  addConditionGroup: (operator: ConditionGroupOperatorType, parentId?: string) => string;

  // Update a condition's properties (Operator, LHSField, RHSValue)
  updateCondition: (id: string, updates: Partial<Omit<ConditionType<T>, "id">>) => void;

  // Change a group's operator (And, Or, Not)
  updateGroupOperator: (id: string, operator: ConditionGroupOperatorType) => void;

  // Remove a condition or group by ID
  removeCondition: (id: string) => void;

  // Get a condition or group by ID
  getCondition: (id: string) => ConditionType<T> | ConditionGroupType<T> | undefined;

  // Remove all conditions and groups
  clearAllConditions: () => void;

  // Change the root operator
  setRootOperator: (operator: ConditionGroupOperatorType) => void;
}
```

## Operator Applicability

| Operator | Applicable Field Types |
|----------|----------------------|
| EQ, NE | All types |
| GT, GTE, LT, LTE | number, date, currency |
| Between, NotBetween | number, date, currency |
| IN, NIN | All types |
| Empty, NotEmpty | All types |
| Contains, NotContains | string only |
| MinLength, MaxLength | string only |

## Basic Example

Create a simple filter with one condition.

```tsx
import { useFilter } from "@ram_28/kf-ai-sdk/filter";

function SimpleFilter() {
  const filter = useFilter();

  const addCategoryFilter = () => {
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
    });
  };

  return (
    <div>
      <button onClick={addCategoryFilter}>Filter by Electronics</button>
      <button onClick={filter.clearAllConditions} disabled={!filter.hasConditions}>
        Clear
      </button>
      <p>Active filters: {filter.items.length}</p>
    </div>
  );
}
```

---

## Type-Safe Filtering

Use the generic type parameter to get TypeScript validation on field names.

### With Generic Type

```tsx
import { useFilter } from "@ram_28/kf-ai-sdk/filter";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductType<typeof Roles.Buyer>;

function TypeSafeFilter() {
  // Pass the type parameter for type-safe LHSField
  const filter = useFilter<BuyerProduct>();

  const addCategoryFilter = () => {
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",  // TypeScript validates this field exists
      RHSValue: "Electronics",
    });
  };

  const addInvalidFilter = () => {
    filter.addCondition({
      Operator: "EQ",
      LHSField: "InvalidField",  // TypeScript error: not a key of BuyerProduct
      RHSValue: "test",
    });
  };

  return (
    <div>
      <button onClick={addCategoryFilter}>Filter by Category</button>
    </div>
  );
}
```

### UseFilterOptionsType for Initial State

`UseFilterOptionsType<T>` is used for:
- Initializing `useFilter` directly
- Setting `initialState.filter` in `useTable`
- Setting `initialState.filter` in `useKanban`

```tsx
import { useFilter } from "@ram_28/kf-ai-sdk/filter";
import type { UseFilterOptionsType } from "@ram_28/kf-ai-sdk/filter/types";
import { Product, ProductType } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductType<typeof Roles.Buyer>;

// Type-safe filter options
const initialFilter: UseFilterOptionsType<BuyerProduct> = {
  conditions: [
    { Operator: "EQ", LHSField: "Category", RHSValue: "Electronics" },
    { Operator: "GT", LHSField: "Price", RHSValue: 100 },
  ],
  operator: "And",
};

// Use with useFilter
const filter = useFilter<BuyerProduct>(initialFilter);
```

---

## Condition Types

### Equality (EQ, NE)

Match or exclude exact values.

```tsx
function EqualityFilters() {
  const filter = useFilter();

  // Exact match
  const filterByStatus = (status: string) => {
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Status",
      RHSValue: status,
    });
  };

  // Exclude a value
  const excludeStatus = (status: string) => {
    filter.addCondition({
      Operator: "NE",
      LHSField: "Status",
      RHSValue: status,
    });
  };

  return (
    <div>
      <button onClick={() => filterByStatus("Active")}>Active Only</button>
      <button onClick={() => excludeStatus("Archived")}>Exclude Archived</button>
    </div>
  );
}
```

### Comparison (GT, GTE, LT, LTE)

Filter by numeric or date comparisons.

```tsx
function ComparisonFilters() {
  const filter = useFilter();

  // Price greater than
  const filterByMinPrice = (minPrice: number) => {
    filter.addCondition({
      Operator: "GT",
      LHSField: "Price",
      RHSValue: minPrice,
    });
  };

  // Stock less than or equal
  const filterLowStock = (threshold: number) => {
    filter.addCondition({
      Operator: "LTE",
      LHSField: "Stock",
      RHSValue: threshold,
    });
  };

  // Date comparison
  const filterRecent = () => {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    filter.addCondition({
      Operator: "GTE",
      LHSField: "CreatedAt",
      RHSValue: lastWeek,
    });
  };

  return (
    <div>
      <button onClick={() => filterByMinPrice(100)}>Price > $100</button>
      <button onClick={() => filterLowStock(10)}>Low Stock</button>
      <button onClick={filterRecent}>Created This Week</button>
    </div>
  );
}
```

### Range (Between, NotBetween)

Filter values within or outside a range.

```tsx
function RangeFilters() {
  const filter = useFilter();

  // Price between range
  const filterPriceRange = (min: number, max: number) => {
    filter.addCondition({
      Operator: "Between",
      LHSField: "Price",
      RHSValue: [min, max],
    });
  };

  // Date range
  const filterDateRange = (startDate: string, endDate: string) => {
    filter.addCondition({
      Operator: "Between",
      LHSField: "OrderDate",
      RHSValue: [startDate, endDate],
    });
  };

  // Exclude range
  const excludePriceRange = (min: number, max: number) => {
    filter.addCondition({
      Operator: "NotBetween",
      LHSField: "Price",
      RHSValue: [min, max],
    });
  };

  return (
    <div>
      <button onClick={() => filterPriceRange(50, 200)}>$50 - $200</button>
      <button onClick={() => excludePriceRange(0, 10)}>Exclude Under $10</button>
    </div>
  );
}
```

### List (IN, NIN)

Match against a list of values.

```tsx
function ListFilters() {
  const filter = useFilter();

  // Match any in list
  const filterByCategories = (categories: string[]) => {
    filter.addCondition({
      Operator: "IN",
      LHSField: "Category",
      RHSValue: categories,
    });
  };

  // Exclude list
  const excludeCategories = (categories: string[]) => {
    filter.addCondition({
      Operator: "NIN",
      LHSField: "Category",
      RHSValue: categories,
    });
  };

  return (
    <div>
      <button onClick={() => filterByCategories(["Electronics", "Computers"])}>
        Electronics & Computers
      </button>
      <button onClick={() => excludeCategories(["Clearance", "Discontinued"])}>
        Exclude Clearance
      </button>
    </div>
  );
}
```

### Text (Contains, NotContains)

Search within text fields.

```tsx
function TextFilters() {
  const filter = useFilter();

  // Contains text
  const filterByKeyword = (keyword: string) => {
    filter.addCondition({
      Operator: "Contains",
      LHSField: "Title",
      RHSValue: keyword,
    });
  };

  // Does not contain
  const excludeKeyword = (keyword: string) => {
    filter.addCondition({
      Operator: "NotContains",
      LHSField: "Description",
      RHSValue: keyword,
    });
  };

  return (
    <div>
      <input
        placeholder="Search..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            filterByKeyword((e.target as HTMLInputElement).value);
          }
        }}
      />
    </div>
  );
}
```

### Empty Checks (Empty, NotEmpty)

Filter by presence or absence of values.

```tsx
function EmptyFilters() {
  const filter = useFilter();

  // Has no value
  const filterUnassigned = () => {
    filter.addCondition({
      Operator: "Empty",
      LHSField: "AssignedTo",
      RHSValue: null,
    });
  };

  // Has a value
  const filterAssigned = () => {
    filter.addCondition({
      Operator: "NotEmpty",
      LHSField: "AssignedTo",
      RHSValue: null,
    });
  };

  return (
    <div>
      <button onClick={filterUnassigned}>Unassigned Tasks</button>
      <button onClick={filterAssigned}>Assigned Tasks</button>
    </div>
  );
}
```

---

## Condition Groups

### AND Logic

All conditions must match.

```tsx
function AndFilter() {
  const filter = useFilter({
    operator: "And",
  });

  const applyFilters = () => {
    filter.clearAllConditions();

    // Category AND Price AND InStock - all must be true
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
    });
    filter.addCondition({
      Operator: "LTE",
      LHSField: "Price",
      RHSValue: 500,
    });
    filter.addCondition({
      Operator: "GT",
      LHSField: "Stock",
      RHSValue: 0,
    });
  };

  return (
    <div>
      <button onClick={applyFilters}>
        Electronics under $500, In Stock
      </button>
      <p>Root operator: {filter.operator}</p>
    </div>
  );
}
```

### OR Logic

Any condition can match.

```tsx
function OrFilter() {
  const filter = useFilter({
    operator: "Or",
  });

  const applyFilters = () => {
    filter.clearAllConditions();

    // High priority OR Overdue - either can match
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Priority",
      RHSValue: "High",
    });
    filter.addCondition({
      Operator: "LT",
      LHSField: "DueDate",
      RHSValue: new Date().toISOString(),
    });
  };

  return (
    <button onClick={applyFilters}>Urgent Tasks</button>
  );
}
```

### Nested Groups

Combine AND and OR logic.

```tsx
function NestedFilter() {
  const filter = useFilter({
    operator: "And",
  });

  // Build: Category = "Electronics" AND (Price < 100 OR OnSale = true)
  const applyComplexFilter = () => {
    filter.clearAllConditions();

    // Root level condition
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
    });

    // Create nested OR group
    const orGroupId = filter.addConditionGroup("Or");

    // Add conditions to the OR group
    filter.addCondition({
      Operator: "LT",
      LHSField: "Price",
      RHSValue: 100,
    }, orGroupId);

    filter.addCondition({
      Operator: "EQ",
      LHSField: "OnSale",
      RHSValue: true,
    }, orGroupId);
  };

  return (
    <button onClick={applyComplexFilter}>
      Affordable Electronics
    </button>
  );
}
```

### Deep Nesting

Create multiple levels of nested groups.

```tsx
function DeepNestedFilter() {
  const filter = useFilter();

  // Build: (A AND B) OR (C AND D)
  const buildFilter = () => {
    filter.clearAllConditions();
    filter.setRootOperator("Or");

    // First AND group
    const group1 = filter.addConditionGroup("And");
    filter.addCondition({ Operator: "EQ", LHSField: "Type", RHSValue: "A" }, group1);
    filter.addCondition({ Operator: "GT", LHSField: "Value", RHSValue: 10 }, group1);

    // Second AND group
    const group2 = filter.addConditionGroup("And");
    filter.addCondition({ Operator: "EQ", LHSField: "Type", RHSValue: "B" }, group2);
    filter.addCondition({ Operator: "LT", LHSField: "Value", RHSValue: 5 }, group2);
  };

  return <button onClick={buildFilter}>Apply Complex Filter</button>;
}
```

---

## Displaying Filters

### Render Active Filters

Show current filter conditions with remove buttons.

```tsx
import { isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";

function ActiveFilters() {
  const filter = useFilter();

  const renderItem = (item: ConditionType | ConditionGroupType) => {
    if (isCondition(item)) {
      return (
        <span key={item.id} className="filter-tag">
          {item.LHSField} {item.Operator} {String(item.RHSValue)}
          <button onClick={() => filter.removeCondition(item.id!)}>x</button>
        </span>
      );
    }

    if (isConditionGroup(item)) {
      return (
        <span key={item.id} className="filter-group">
          {item.Operator} ({item.Condition.length} conditions)
          <button onClick={() => filter.removeCondition(item.id!)}>x</button>
        </span>
      );
    }

    return null;
  };

  return (
    <div className="active-filters">
      {filter.items.map(renderItem)}
      {filter.hasConditions && (
        <button onClick={filter.clearAllConditions}>Clear All</button>
      )}
    </div>
  );
}
```

### Recursive Tree Display

Display nested filter structure as a tree.

```tsx
function FilterTree() {
  const filter = useFilter();

  const renderNode = (item: ConditionType | ConditionGroupType, depth = 0) => {
    const indent = { marginLeft: depth * 20 };

    if (isCondition(item)) {
      return (
        <div key={item.id} style={indent} className="filter-condition">
          {item.LHSField} {item.Operator} {JSON.stringify(item.RHSValue)}
        </div>
      );
    }

    if (isConditionGroup(item)) {
      return (
        <div key={item.id} style={indent} className="filter-group">
          <strong>{item.Operator}</strong>
          {item.Condition.map((child) => renderNode(child, depth + 1))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="filter-tree">
      <div className="root">
        <strong>Root: {filter.operator}</strong>
      </div>
      {filter.items.map((item) => renderNode(item, 1))}
    </div>
  );
}
```

---

## Modifying Filters

### Update a Condition

Change an existing condition's values.

```tsx
function EditableFilter() {
  const filter = useFilter();
  const [conditionId, setConditionId] = useState<string | null>(null);

  const addFilter = () => {
    const id = filter.addCondition({
      Operator: "GT",
      LHSField: "Price",
      RHSValue: 50,
    });
    setConditionId(id);
  };

  const updateValue = (newValue: number) => {
    if (conditionId) {
      filter.updateCondition(conditionId, { RHSValue: newValue });
    }
  };

  const updateOperator = (operator: ConditionOperatorType) => {
    if (conditionId) {
      filter.updateCondition(conditionId, { Operator: operator });
    }
  };

  return (
    <div>
      <button onClick={addFilter}>Add Price Filter</button>
      {conditionId && (
        <div>
          <select onChange={(e) => updateOperator(e.target.value as ConditionOperatorType)}>
            <option value="GT">Greater Than</option>
            <option value="LT">Less Than</option>
            <option value="EQ">Equals</option>
          </select>
          <input
            type="number"
            defaultValue={50}
            onChange={(e) => updateValue(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}
```

### Change Group Operator

Toggle between AND/OR for a group.

```tsx
function ToggleableGroupOperator() {
  const filter = useFilter();
  const [groupId, setGroupId] = useState<string | null>(null);

  const createGroup = () => {
    const id = filter.addConditionGroup("And");
    filter.addCondition({ Operator: "EQ", LHSField: "A", RHSValue: 1 }, id);
    filter.addCondition({ Operator: "EQ", LHSField: "B", RHSValue: 2 }, id);
    setGroupId(id);
  };

  const toggleOperator = () => {
    if (groupId) {
      const group = filter.getCondition(groupId) as ConditionGroupType;
      const newOp = group.Operator === "And" ? "Or" : "And";
      filter.updateGroupOperator(groupId, newOp);
    }
  };

  return (
    <div>
      <button onClick={createGroup}>Create Group</button>
      {groupId && (
        <button onClick={toggleOperator}>Toggle AND/OR</button>
      )}
    </div>
  );
}
```

---

## Using Filter Payload

### Get API-Ready Payload

Access the filter structure for API calls.

```tsx
function FilterWithApi() {
  const filter = useFilter();

  const fetchFiltered = async () => {
    const payload = filter.payload;

    if (!payload) {
      console.log("No filters applied");
      return;
    }

    // Payload is ready for API - no internal IDs included
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Filter: payload }),
    });

    return response.json();
  };

  return (
    <div>
      <button onClick={() => filter.addCondition({
        Operator: "EQ",
        LHSField: "Status",
        RHSValue: "Active",
      })}>
        Add Filter
      </button>
      <button onClick={fetchFiltered}>Fetch Data</button>

      <pre>{JSON.stringify(filter.payload, null, 2)}</pre>
    </div>
  );
}
```

### Initialize with Existing Filters

Load filters from saved state.

```tsx
function FilterWithInitialState() {
  const savedFilters: Array<ConditionType | ConditionGroupType> = [
    { Operator: "EQ", LHSField: "Status", RHSValue: "Active" },
    { Operator: "GT", LHSField: "Price", RHSValue: 100 },
  ];

  const filter = useFilter({
    conditions: savedFilters,
    operator: "And",
  });

  return (
    <div>
      <p>Loaded {filter.items.length} filters</p>
      {/* filter UI */}
    </div>
  );
}
```

---

## Payload Structure

The `filter.payload` property returns the filter structure ready for API consumption. Here are examples of what the JSON looks like for different scenarios.

### Single Condition

```tsx
filter.addCondition({
  Operator: "EQ",
  LHSField: "Status",
  RHSValue: "Active",
});
```

Produces:

```json
{
  "Operator": "And",
  "Condition": [
    {
      "Operator": "EQ",
      "LHSField": "Status",
      "RHSValue": "Active",
      "RHSType": "Constant"
    }
  ]
}
```

### Multiple Conditions (AND)

```tsx
filter.addCondition({ Operator: "EQ", LHSField: "Category", RHSValue: "Electronics" });
filter.addCondition({ Operator: "GT", LHSField: "Price", RHSValue: 100 });
filter.addCondition({ Operator: "LTE", LHSField: "Stock", RHSValue: 50 });
```

Produces:

```json
{
  "Operator": "And",
  "Condition": [
    { "Operator": "EQ", "LHSField": "Category", "RHSValue": "Electronics", "RHSType": "Constant" },
    { "Operator": "GT", "LHSField": "Price", "RHSValue": 100, "RHSType": "Constant" },
    { "Operator": "LTE", "LHSField": "Stock", "RHSValue": 50, "RHSType": "Constant" }
  ]
}
```

### Nested Groups

```tsx
// Root: AND
// Category = "Electronics" AND (Price < 100 OR OnSale = true)
filter.addCondition({ Operator: "EQ", LHSField: "Category", RHSValue: "Electronics" });
const orGroupId = filter.addConditionGroup("Or");
filter.addCondition({ Operator: "LT", LHSField: "Price", RHSValue: 100 }, orGroupId);
filter.addCondition({ Operator: "EQ", LHSField: "OnSale", RHSValue: true }, orGroupId);
```

Produces:

```json
{
  "Operator": "And",
  "Condition": [
    { "Operator": "EQ", "LHSField": "Category", "RHSValue": "Electronics", "RHSType": "Constant" },
    {
      "Operator": "Or",
      "Condition": [
        { "Operator": "LT", "LHSField": "Price", "RHSValue": 100, "RHSType": "Constant" },
        { "Operator": "EQ", "LHSField": "OnSale", "RHSValue": true, "RHSType": "Constant" }
      ]
    }
  ]
}
```

### Range Values (Between)

```tsx
filter.addCondition({
  Operator: "Between",
  LHSField: "Price",
  RHSValue: [50, 200],
});
```

Produces:

```json
{
  "Operator": "And",
  "Condition": [
    { "Operator": "Between", "LHSField": "Price", "RHSValue": [50, 200], "RHSType": "Constant" }
  ]
}
```

### List Values (IN)

```tsx
filter.addCondition({
  Operator: "IN",
  LHSField: "Category",
  RHSValue: ["Electronics", "Computers", "Accessories"],
});
```

Produces:

```json
{
  "Operator": "And",
  "Condition": [
    { "Operator": "IN", "LHSField": "Category", "RHSValue": ["Electronics", "Computers", "Accessories"], "RHSType": "Constant" }
  ]
}
```

> **Note:** The `RHSType` field defaults to `"Constant"` and is automatically added to the payload. Other possible values are `"BOField"` (reference another field) and `"AppVariable"` (reference an application variable).
