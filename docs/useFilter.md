# useFilter

## Brief Description

- Manages filter conditions with support for nested filter groups (AND/OR/NOT operators)
- Provides a clean API for building complex filter payloads that match the backend API format
- Supports both flat conditions and nested condition groups for advanced filtering scenarios
- Includes type guards (`isCondition`, `isConditionGroup`) for safely working with the filter tree structure

## Type Reference

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
  FilterRHSTypeType,
} from "@ram_28/kf-ai-sdk/filter/types";

// Condition operators for comparing field values
type ConditionOperatorType =
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE"
  | "Between" | "NotBetween"
  | "IN" | "NIN"
  | "Empty" | "NotEmpty"
  | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

// Group operators for combining conditions
type ConditionGroupOperatorType = "And" | "Or" | "Not";

// RHS type for condition values
type FilterRHSTypeType = "Constant" | "BOField" | "AppVariable";

// Leaf condition (matches API format)
interface ConditionType {
  id?: string;
  Operator: ConditionOperatorType;
  LHSField: string;
  RHSValue: any;
  RHSType?: FilterRHSTypeType;
}

// Condition group (recursive structure)
interface ConditionGroupType {
  id?: string;
  Operator: ConditionGroupOperatorType;
  Condition: Array<ConditionType | ConditionGroupType>;
}

// Filter payload (alias for ConditionGroupType)
type FilterType = ConditionGroupType;

// Hook options
interface UseFilterOptionsType {
  initialConditions?: Array<ConditionType | ConditionGroupType>;
  initialOperator?: ConditionGroupOperatorType;
}

// Hook return type
interface UseFilterReturnType {
  // State (read-only)
  operator: ConditionGroupOperatorType;
  items: Array<ConditionType | ConditionGroupType>;
  payload: FilterType | undefined;
  hasConditions: boolean;

  // Add operations (return id of created item)
  addCondition: (condition: Omit<ConditionType, "id">, parentId?: string) => string;
  addConditionGroup: (operator: ConditionGroupOperatorType, parentId?: string) => string;

  // Update operations
  updateCondition: (id: string, updates: Partial<Omit<ConditionType, "id">>) => void;
  updateGroupOperator: (id: string, operator: ConditionGroupOperatorType) => void;

  // Remove & access
  removeCondition: (id: string) => void;
  getCondition: (id: string) => ConditionType | ConditionGroupType | undefined;

  // Utility
  clearAllConditions: () => void;
  setRootOperator: (op: ConditionGroupOperatorType) => void;
}

// Type guards
const isCondition: (item: ConditionType | ConditionGroupType) => item is ConditionType;
const isConditionGroup: (item: ConditionType | ConditionGroupType) => item is ConditionGroupType;
```

## Usage Example

```tsx
import { useFilter, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";
import type {
  ConditionType,
  ConditionGroupType,
  ConditionGroupOperatorType,
  FilterType,
  UseFilterOptionsType,
  UseFilterReturnType,
} from "@ram_28/kf-ai-sdk/filter/types";

function ProductFilterBuilder() {
  // Initialize hook with options
  const options: UseFilterOptionsType = {
    initialOperator: "And",
  };
  const filter: UseFilterReturnType = useFilter(options);

  // Add a simple condition at root level
  const handleAddCondition = () => {
    const id = filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
      RHSType: "Constant",
    });
    console.log("Created condition with id:", id);
  };

  // Build nested filter: (Category = "Electronics") AND (Price > 100 OR OnSale = true)
  const handleBuildComplexFilter = () => {
    filter.clearAllConditions();

    // Add root condition
    filter.addCondition({
      Operator: "EQ",
      LHSField: "Category",
      RHSValue: "Electronics",
    });

    // Create nested OR group
    const groupId = filter.addConditionGroup("Or");

    // Add conditions to the group
    filter.addCondition({
      Operator: "GT",
      LHSField: "Price",
      RHSValue: 100,
    }, groupId);

    const saleConditionId = filter.addCondition({
      Operator: "EQ",
      LHSField: "OnSale",
      RHSValue: true,
    }, groupId);

    // Update a condition
    filter.updateCondition(saleConditionId, { RHSValue: false });

    // Toggle group operator
    filter.updateGroupOperator(groupId, "And");
  };

  // Render filter tree recursively
  const renderFilterItem = (item: ConditionType | ConditionGroupType, depth = 0): JSX.Element => {
    const indent = { marginLeft: depth * 20 };

    if (isCondition(item)) {
      return (
        <div key={item.id} style={indent} className="filter-condition">
          <span>
            {item.LHSField} {item.Operator} {String(item.RHSValue)}
          </span>
          <button onClick={() => filter.removeCondition(item.id!)}>Remove</button>
          <button onClick={() => filter.updateCondition(item.id!, { RHSValue: "Updated" })}>
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
                filter.updateGroupOperator(item.id!, e.target.value as ConditionGroupOperatorType)
              }
            >
              <option value="And">AND</option>
              <option value="Or">OR</option>
              <option value="Not">NOT</option>
            </select>
            <button onClick={() => filter.addCondition({ Operator: "EQ", LHSField: "Field", RHSValue: "" }, item.id!)}>
              + Condition
            </button>
            <button onClick={() => filter.addConditionGroup("And", item.id!)}>+ Group</button>
            <button onClick={() => filter.removeCondition(item.id!)}>Remove Group</button>
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
    const payload: FilterType | undefined = filter.payload;
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
    const item = filter.getCondition(id);
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
            onChange={(e) => filter.setRootOperator(e.target.value as ConditionGroupOperator)}
          >
            <option value="And">AND</option>
            <option value="Or">OR</option>
          </select>
        </label>
        <button onClick={handleAddCondition}>Add Condition</button>
        <button onClick={() => filter.addConditionGroup("Or")}>Add Group</button>
        <button onClick={handleBuildComplexFilter}>Build Complex Filter</button>
        <button onClick={filter.clearAllConditions} disabled={!filter.hasConditions}>
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
