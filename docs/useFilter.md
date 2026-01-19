# useFilter

## Brief Description

- Manages filter conditions with support for nested filter groups (AND/OR/NOT operators)
- Provides a clean API for building complex filter payloads that match the backend API format
- Supports both flat conditions and nested condition groups for advanced filtering scenarios
- Includes type guards (`isCondition`, `isConditionGroup`) for safely working with the filter tree structure

## Type Reference

```typescript
import { useFilter, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk";
import type {
  UseFilterOptions,
  UseFilterReturn,
  Condition,
  ConditionGroup,
  ConditionOperator,
  ConditionGroupOperator,
  Filter,
  FilterRHSType,
} from "@ram_28/kf-ai-sdk";

// Condition operators for comparing field values
type ConditionOperator =
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE"
  | "Between" | "NotBetween"
  | "IN" | "NIN"
  | "Empty" | "NotEmpty"
  | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

// Group operators for combining conditions
type ConditionGroupOperator = "And" | "Or" | "Not";

// RHS type for condition values
type FilterRHSType = "Constant" | "BOField" | "AppVariable";

// Leaf condition (matches API format)
interface Condition {
  id?: string;
  Operator: ConditionOperator;
  LHSField: string;
  RHSValue: any;
  RHSType?: FilterRHSType;
}

// Condition group (recursive structure)
interface ConditionGroup {
  id?: string;
  Operator: ConditionGroupOperator;
  Condition: Array<Condition | ConditionGroup>;
}

// Filter payload (alias for ConditionGroup)
type Filter = ConditionGroup;

// Hook options
interface UseFilterOptions {
  initialConditions?: Array<Condition | ConditionGroup>;
  initialOperator?: ConditionGroupOperator;
}

// Hook return type
interface UseFilterReturn {
  // State (read-only)
  operator: ConditionGroupOperator;
  items: Array<Condition | ConditionGroup>;
  payload: Filter | undefined;
  hasConditions: boolean;

  // Add operations (return id of created item)
  add: (condition: Omit<Condition, "id">) => string;
  addGroup: (operator: ConditionGroupOperator) => string;
  addTo: (parentId: string, condition: Omit<Condition, "id">) => string;
  addGroupTo: (parentId: string, operator: ConditionGroupOperator) => string;

  // Update operations
  update: (id: string, updates: Partial<Omit<Condition, "id">>) => void;
  updateOperator: (id: string, operator: ConditionGroupOperator) => void;

  // Remove & access
  remove: (id: string) => void;
  get: (id: string) => Condition | ConditionGroup | undefined;

  // Utility
  clear: () => void;
  setOperator: (op: ConditionGroupOperator) => void;

  // Legacy (deprecated)
  conditions: Array<Condition | ConditionGroup>;
}

// Type guards
const isCondition: (item: Condition | ConditionGroup) => item is Condition;
const isConditionGroup: (item: Condition | ConditionGroup) => item is ConditionGroup;
```

## Usage Example

```tsx
import { useFilter, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk";
import type {
  Condition,
  ConditionGroup,
  ConditionGroupOperator,
  Filter,
  UseFilterOptions,
  UseFilterReturn,
} from "@ram_28/kf-ai-sdk";

function ProductFilterBuilder() {
  // Initialize hook with options
  const options: UseFilterOptions = {
    initialOperator: "And",
  };
  const filter: UseFilterReturn = useFilter(options);

  // Add a simple condition at root level
  const handleAddCondition = () => {
    const id = filter.add({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
      RHSType: "Constant",
    });
    console.log("Created condition with id:", id);
  };

  // Build nested filter: (Category = "Electronics") AND (Price > 100 OR OnSale = true)
  const handleBuildComplexFilter = () => {
    filter.clear();

    // Add root condition
    filter.add({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
    });

    // Create nested OR group
    const groupId = filter.addGroup("Or");

    // Add conditions to the group
    filter.addTo(groupId, {
      Operator: "GT",
      LHSField: "Price",
      RHSValue: 100,
    });

    const saleConditionId = filter.addTo(groupId, {
      Operator: "EQ",
      LHSField: "OnSale",
      RHSValue: true,
    });

    // Update a condition
    filter.update(saleConditionId, { RHSValue: false });

    // Toggle group operator
    filter.updateOperator(groupId, "And");
  };

  // Render filter tree recursively
  const renderFilterItem = (item: Condition | ConditionGroup, depth = 0): JSX.Element => {
    const indent = { marginLeft: depth * 20 };

    if (isCondition(item)) {
      return (
        <div key={item.id} style={indent} className="filter-condition">
          <span>
            {item.LHSField} {item.Operator} {String(item.RHSValue)}
          </span>
          <button onClick={() => filter.remove(item.id!)}>Remove</button>
          <button onClick={() => filter.update(item.id!, { RHSValue: "Updated" })}>
            Update
          </button>
        </div>
      );
    }

    if (isConditionGroup(item)) {
      return (
        <div key={item.id} style={indent} className="filter-group">
          <div className="group-header">
            <select
              value={item.Operator}
              onChange={(e) =>
                filter.updateOperator(item.id!, e.target.value as ConditionGroupOperator)
              }
            >
              <option value="And">AND</option>
              <option value="Or">OR</option>
              <option value="Not">NOT</option>
            </select>
            <button onClick={() => filter.addTo(item.id!, { Operator: "EQ", LHSField: "Field", RHSValue: "" })}>
              + Condition
            </button>
            <button onClick={() => filter.addGroupTo(item.id!, "And")}>+ Group</button>
            <button onClick={() => filter.remove(item.id!)}>Remove Group</button>
          </div>
          <div className="group-conditions">
            {item.Condition.map((child) => renderFilterItem(child, depth + 1))}
          </div>
        </div>
      );
    }

    return <></>;
  };

  // Use filter payload in API call
  const handleApplyFilter = async () => {
    const payload: Filter | undefined = filter.payload;
    if (payload) {
      console.log("API Payload (no ids):", JSON.stringify(payload, null, 2));
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Filter: payload }),
      });
      return response.json();
    }
  };

  // Access individual item by id
  const handleGetItem = (id: string) => {
    const item = filter.get(id);
    if (item) {
      console.log("Found item:", item);
    }
  };

  return (
    <div className="filter-builder">
      {/* Root operator control */}
      <div className="root-controls">
        <label>
          Root Operator:
          <select
            value={filter.operator}
            onChange={(e) => filter.setOperator(e.target.value as ConditionGroupOperator)}
          >
            <option value="And">AND</option>
            <option value="Or">OR</option>
          </select>
        </label>
        <button onClick={handleAddCondition}>Add Condition</button>
        <button onClick={() => filter.addGroup("Or")}>Add Group</button>
        <button onClick={handleBuildComplexFilter}>Build Complex Filter</button>
        <button onClick={filter.clear} disabled={!filter.hasConditions}>
          Clear All
        </button>
      </div>

      {/* Filter tree display */}
      <div className="filter-tree">
        <h3>Filter Tree ({filter.items.length} root items)</h3>
        {filter.items.map((item) => renderFilterItem(item))}
      </div>

      {/* Apply filter */}
      <div className="filter-actions">
        <button onClick={handleApplyFilter} disabled={!filter.hasConditions}>
          Apply Filter
        </button>
        <span>Has conditions: {filter.hasConditions ? "Yes" : "No"}</span>
      </div>

      {/* Debug payload (id fields are stripped) */}
      <pre className="filter-payload">
        {JSON.stringify(filter.payload, null, 2)}
      </pre>
    </div>
  );
}
```
