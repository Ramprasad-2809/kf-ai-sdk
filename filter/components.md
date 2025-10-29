# Headless Filter UI Components

Unstyled, accessible UI components for building custom filter interfaces. Built on top of the headless filter builder, these components provide the functionality without any design opinions - just like Shadcn/UI.

## Philosophy

- **Unstyled** - No CSS, no design constraints, bring your own styles
- **Accessible** - ARIA labels, keyboard navigation, screen reader support built-in
- **Composable** - Mix and match components to build your ideal interface
- **Type-Safe** - Full TypeScript support with intelligent autocomplete
- **Framework Agnostic** - Works with any CSS framework or design system

## Core Components

### FilterRoot

The main container component that provides filter context to all child components.

```tsx
import { FilterRoot } from "@kf-ai-sdk/headless-filter/ui";

<FilterRoot
  onFilterChange={handleFilterChange}
  initialFilter={existingFilter}
  className="my-filter-container"
>
  {/* All other filter components go here */}
</FilterRoot>;
```

**Props:**

- `onFilterChange?: (filter: FilterJSON) => void` - Called when filter changes
- `initialFilter?: FilterJSON` - Pre-populate with existing filter
- `autoApply?: boolean` - Auto-trigger onFilterChange (default: true)
- `debounceMs?: number` - Debounce filter changes (default: 300)

### FilterGroup

Container for organizing conditions with AND/OR logic.

```tsx
import { FilterGroup } from "@kf-ai-sdk/headless-filter/ui";

<FilterGroup>
  {({
    operator,
    conditions,
    groups,
    toggleOperator,
    addCondition,
    addGroup,
  }) => (
    <div className="filter-group">
      <button onClick={toggleOperator} className="operator-button">
        {operator}
      </button>

      {conditions.map((condition) => (
        <FilterCondition key={condition.id} conditionId={condition.id} />
      ))}

      <button onClick={addCondition}>Add Condition</button>
      <button onClick={addGroup}>Add Group</button>
    </div>
  )}
</FilterGroup>;
```

**Render Props:**

- `operator: 'AND' | 'OR'` - Current group operator
- `conditions: Condition[]` - Conditions in this group
- `groups: Group[]` - Nested groups
- `toggleOperator: () => void` - Toggle between AND/OR
- `addCondition: () => string` - Add new condition, returns ID
- `addGroup: () => string` - Add nested group, returns ID

### FilterCondition

Individual filter condition with field, operator, and value controls.

```tsx
import { FilterCondition } from "@kf-ai-sdk/headless-filter/ui";

<FilterCondition conditionId="condition-123">
  {({
    condition,
    updateCondition,
    removeCondition,
    fieldOptions,
    operatorOptions,
  }) => (
    <div className="condition-row">
      <select
        value={condition.field}
        onChange={(e) => updateCondition({ field: e.target.value })}
      >
        {fieldOptions.map((field) => (
          <option key={field.value} value={field.value}>
            {field.label}
          </option>
        ))}
      </select>

      <select
        value={condition.operator}
        onChange={(e) => updateCondition({ operator: e.target.value })}
      >
        {operatorOptions.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      <input
        value={condition.value || ""}
        onChange={(e) => updateCondition({ value: e.target.value })}
        placeholder="Enter value..."
      />

      <button onClick={removeCondition}>Remove</button>
    </div>
  )}
</FilterCondition>;
```

**Props:**

- `conditionId: string` - ID of the condition to render

**Render Props:**

- `condition: Condition` - Current condition data
- `updateCondition: (updates: Partial<Condition>) => void` - Update condition
- `removeCondition: () => void` - Remove this condition
- `fieldOptions: FieldOption[]` - Available fields for selection
- `operatorOptions: OperatorOption[]` - Available operators for current field type

## Primitive Components

Low-level building blocks for custom implementations.

### FieldSelect

```tsx
import { FieldSelect } from "@kf-ai-sdk/headless-filter/primitives";

<FieldSelect conditionId="condition-123">
  {({ value, onChange, options, isDisabled }) => (
    <select
      value={value}
      onChange={onChange}
      disabled={isDisabled}
      className="field-select"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )}
</FieldSelect>;
```

### OperatorSelect

```tsx
import { OperatorSelect } from "@kf-ai-sdk/headless-filter/primitives";

<OperatorSelect conditionId="condition-123">
  {({ value, onChange, options, isDisabled }) => (
    <select
      value={value}
      onChange={onChange}
      disabled={isDisabled}
      className="operator-select"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )}
</OperatorSelect>;
```

### ValueInput

```tsx
import { ValueInput } from "@kf-ai-sdk/headless-filter/primitives";

<ValueInput conditionId="condition-123">
  {({ value, onChange, type, placeholder, isDisabled, options }) => {
    if (type === "select") {
      return (
        <select value={value} onChange={onChange} disabled={isDisabled}>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={isDisabled}
        className="value-input"
      />
    );
  }}
</ValueInput>;
```

### RHSTypeSelect

```tsx
import { RHSTypeSelect } from "@kf-ai-sdk/headless-filter/primitives";

<RHSTypeSelect conditionId="condition-123">
  {({ value, onChange, options }) => (
    <select value={value} onChange={onChange}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )}
</RHSTypeSelect>;
```

## Utility Components

### FilterSummary

Displays a human-readable summary of the current filter.

```tsx
import { FilterSummary } from "@kf-ai-sdk/headless-filter/ui";

<FilterSummary>
  {({ summary, isEmpty, conditionCount }) => (
    <div className="filter-summary">
      {isEmpty ? (
        <p>No filters applied</p>
      ) : (
        <div>
          <h4>{conditionCount} conditions active</h4>
          <ul>
            {summary.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )}
</FilterSummary>;
```

### FilterActions

Common action buttons with built-in functionality.

```tsx
import { FilterActions } from "@kf-ai-sdk/headless-filter/ui";

<FilterActions>
  {({ clear, apply, isEmpty, isLoading }) => (
    <div className="filter-actions">
      <button onClick={clear} disabled={isEmpty} className="clear-btn">
        Clear All
      </button>
      <button
        onClick={apply}
        disabled={isEmpty || isLoading}
        className="apply-btn"
      >
        {isLoading ? "Applying..." : "Apply Filter"}
      </button>
    </div>
  )}
</FilterActions>;
```

### FilterCount

Shows active filter count for buttons or badges.

```tsx
import { FilterCount } from "@kf-ai-sdk/headless-filter/ui";

<FilterCount>
  {({ count, isEmpty }) => (
    <span className={`filter-badge ${isEmpty ? "hidden" : "visible"}`}>
      {count}
    </span>
  )}
</FilterCount>;
```

## Complete Examples

### Basic Filter Form

```tsx
import {
  FilterRoot,
  FilterGroup,
  FilterCondition,
  FilterActions,
} from "@kf-ai-sdk/headless-filter/ui";

function BasicFilterForm({ onApply }) {
  return (
    <FilterRoot onFilterChange={onApply} className="space-y-4">
      <FilterGroup>
        {({ conditions, addCondition }) => (
          <div className="space-y-2">
            {conditions.map((condition) => (
              <FilterCondition key={condition.id} conditionId={condition.id}>
                {({
                  condition,
                  updateCondition,
                  removeCondition,
                  fieldOptions,
                  operatorOptions,
                }) => (
                  <div className="flex gap-2 p-2 border rounded">
                    <select
                      value={condition.field}
                      onChange={(e) =>
                        updateCondition({ field: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    >
                      {fieldOptions.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition({ operator: e.target.value })
                      }
                      className="border rounded px-2 py-1"
                    >
                      {operatorOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    <input
                      value={condition.value || ""}
                      onChange={(e) =>
                        updateCondition({ value: e.target.value })
                      }
                      className="border rounded px-2 py-1 flex-1"
                      placeholder="Enter value..."
                    />

                    <button
                      onClick={removeCondition}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                )}
              </FilterCondition>
            ))}

            <button
              onClick={addCondition}
              className="w-full border-2 border-dashed border-gray-300 rounded p-2 text-gray-600 hover:border-gray-400"
            >
              Add Condition
            </button>
          </div>
        )}
      </FilterGroup>

      <FilterActions>
        {({ clear, apply, isEmpty }) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={clear}
              disabled={isEmpty}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={apply}
              disabled={isEmpty}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </FilterActions>
    </FilterRoot>
  );
}
```

### Sidebar Advanced Filter Panel

A clean sidebar-style filter panel similar to modern data management interfaces, with grouped conditions and inline operators.

```tsx
import React, { useState, useEffect } from "react";
import { useFilter, useTable } from "@kf-ai-sdk/headless-filter";
import { X, Plus, ChevronDown, Filter } from "lucide-react";

function SidebarAdvancedFilter({ isOpen, onClose, onResults, onFilterChange }) {
  const filter = useFilter();

  const fieldOptions = [
    { value: "name", label: "Name", type: "text" },
    { value: "email", label: "Email", type: "text" },
    {
      value: "status",
      label: "Status",
      type: "select",
      options: ["active", "inactive", "pending"],
    },
    {
      value: "department",
      label: "Department",
      type: "select",
      options: ["Engineering", "Marketing", "Sales", "HR"],
    },
    {
      value: "role",
      label: "Role",
      type: "select",
      options: ["admin", "user", "moderator"],
    },
    { value: "age", label: "Age", type: "number" },
    { value: "salary", label: "Salary", type: "number" },
    { value: "created_at", label: "Created Date", type: "date" },
    { value: "updated_at", label: "Updated Date", type: "date" },
  ];

  const operatorOptions = [
    { value: "CONTAINS", label: "Contains", types: ["text"] },
    { value: "NOT_CONTAINS", label: "Does not contain", types: ["text"] },
    {
      value: "EQUALS",
      label: "Equals",
      types: ["text", "select", "number", "date"],
    },
    {
      value: "NOT_EQUALS",
      label: "Not equals",
      types: ["text", "select", "number", "date"],
    },
    { value: "GREATER_THAN", label: "Greater than", types: ["number", "date"] },
    { value: "LESS_THAN", label: "Less than", types: ["number", "date"] },
    {
      value: "GREATER_THAN_OR_EQUAL_TO",
      label: "Greater than or equal",
      types: ["number", "date"],
    },
    {
      value: "LESS_THAN_OR_EQUAL_TO",
      label: "Less than or equal",
      types: ["number", "date"],
    },
    {
      value: "IS_NULL",
      label: "Is empty",
      types: ["text", "select", "number", "date"],
    },
    {
      value: "IS_NOT_NULL",
      label: "Is not empty",
      types: ["text", "select", "number", "date"],
    },
  ];

  // Use Table SDK for filtered results - automatically handles React Query
  const table = useTable({
    source: 'users',
    filter: filter.json,
    enablePagination: false, // Show all results for sidebar
    initialState: {
      pagination: { pageSize: 100 }
    }
  });

  // Update parent component when data changes
  useEffect(() => {
    if (table.rows) {
      onResults(table.rows);
      onFilterChange?.(filter.json);
    } else if (filter.isEmpty) {
      onResults([]);
    }
  }, [table.rows, filter.isEmpty]);
  
  const loading = table.isFetching;

  const getAvailableOperators = (fieldType) => {
    return operatorOptions.filter((op) => op.types.includes(fieldType));
  };

  const getFieldType = (fieldValue) => {
    return fieldOptions.find((f) => f.value === fieldValue)?.type || "text";
  };

  const addNewCondition = (groupId = null) => {
    filter.addCondition(groupId, {
      field: "name",
      operator: "CONTAINS",
      rhsType: "Value",
      value: "",
    });
  };

  const renderCondition = (
    condition,
    groupOperator,
    isFirstInGroup = false
  ) => {
    const selectedField = fieldOptions.find((f) => f.value === condition.field);
    const fieldType = selectedField?.type || "text";
    const availableOperators = getAvailableOperators(fieldType);
    const needsValue = !["IS_NULL", "IS_NOT_NULL"].includes(condition.operator);

    return (
      <div key={condition.id} className="space-y-3">
        {!isFirstInGroup && (
          <div className="flex justify-center">
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              {groupOperator}
            </span>
          </div>
        )}

        <div className="p-3 bg-gray-50 rounded-lg border space-y-3">
          <div>
            <select
              value={condition.field}
              onChange={(e) => {
                const newFieldType = getFieldType(e.target.value);
                const newOperator =
                  getAvailableOperators(newFieldType)[0]?.value || "EQUALS";
                filter.updateCondition(condition.id, {
                  field: e.target.value,
                  operator: newOperator,
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fieldOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={condition.operator}
              onChange={(e) =>
                filter.updateCondition(condition.id, {
                  operator: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableOperators.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {needsValue && (
            <div>
              {selectedField?.type === "select" ? (
                <select
                  value={condition.value || ""}
                  onChange={(e) =>
                    filter.updateCondition(condition.id, {
                      value: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select value...</option>
                  {selectedField.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    selectedField?.type === "number"
                      ? "number"
                      : selectedField?.type === "date"
                      ? "date"
                      : "text"
                  }
                  value={condition.value || ""}
                  onChange={(e) =>
                    filter.updateCondition(condition.id, {
                      value: e.target.value,
                    })
                  }
                  placeholder={`Enter ${
                    selectedField?.label.toLowerCase() || "value"
                  }...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => filter.removeCondition(condition.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (group, level = 0) => {
    return (
      <div
        key={group.id}
        className={`space-y-4 ${
          level > 0 ? "ml-4 pl-4 border-l-2 border-gray-200" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => filter.toggleGroupOperator(group.id)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              group.operator === "AND"
                ? "bg-blue-100 text-blue-800"
                : "bg-purple-100 text-purple-800"
            }`}
          >
            {group.operator}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => addNewCondition(group.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Condition
            </button>
            <button
              onClick={() => filter.addGroup(group.id, "AND")}
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              + Group
            </button>
          </div>
        </div>

        {group.conditions.map((condition, index) =>
          renderCondition(condition, group.operator, index === 0)
        )}

        {group.groups.map((nestedGroup) => renderGroup(nestedGroup, level + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Advanced Filter
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {renderGroup(filter.rootGroup)}

            <div className="flex gap-2">
              <button
                onClick={() => addNewCondition()}
                className="flex-1 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 text-sm"
              >
                + Add Condition
              </button>
              <button
                onClick={() => filter.addGroup(null, "AND")}
                className="flex-1 py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 text-sm"
              >
                + Add Group
              </button>
            </div>
          </div>

          <div className="border-t p-6 space-y-4">
            {!filter.isEmpty && (
              <div className="text-sm text-gray-600">
                <div className="font-medium mb-2">Filter Summary:</div>
                <div className="space-y-1">
                  {filter.summary.map((line, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => filter.clear()}
                disabled={filter.isEmpty}
                className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {loading ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarAdvancedFilter;
```

### Filter Button with Count

```tsx
import { FilterCount } from "@kf-ai-sdk/headless-filter/ui";

function FilterButton({ onClick }) {
  return (
    <FilterRoot>
      <button
        onClick={onClick}
        className="relative flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
      >
        <span>Filter</span>
        <FilterCount>
          {({ count, isEmpty }) =>
            !isEmpty && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )
          }
        </FilterCount>
      </button>
    </FilterRoot>
  );
}
```

## Configuration

### Field Configuration

```tsx
const fieldConfig = [
  {
    value: "name",
    label: "Name",
    type: "text",
    operators: ["CONTAINS", "EQUALS", "NOT_EQUALS"],
  },
  {
    value: "status",
    label: "Status",
    type: "select",
    options: ["active", "inactive", "pending"],
    operators: ["EQUALS", "NOT_EQUALS"],
  },
  {
    value: "age",
    label: "Age",
    type: "number",
    operators: [
      "EQUALS",
      "GREATER_THAN",
      "LESS_THAN",
      "GREATER_THAN_OR_EQUAL_TO",
      "LESS_THAN_OR_EQUAL_TO",
    ],
  },
  {
    value: "created_at",
    label: "Created Date",
    type: "date",
    operators: [
      "EQUALS",
      "GREATER_THAN",
      "LESS_THAN",
      "GREATER_THAN_OR_EQUAL_TO",
      "LESS_THAN_OR_EQUAL_TO",
    ],
  },
];

<FilterRoot fieldConfig={fieldConfig}>
  {/* Components automatically use this configuration */}
</FilterRoot>;
```

### Custom Operators

```tsx
const customOperators = {
  CONTAINS: { label: "contains", types: ["text"] },
  STARTS_WITH: { label: "starts with", types: ["text"] },
  ENDS_WITH: { label: "ends with", types: ["text"] },
  IS_EMPTY: { label: "is empty", types: ["text", "select"] },
  IS_NOT_EMPTY: { label: "is not empty", types: ["text", "select"] },
};

<FilterRoot operators={customOperators}>
  {/* Components use custom operators */}
</FilterRoot>;
```

## TypeScript Support

All components are fully typed with comprehensive TypeScript definitions:

```tsx
interface FilterRootProps {
  children: React.ReactNode;
  onFilterChange?: (filter: FilterJSON) => void;
  initialFilter?: FilterJSON;
  autoApply?: boolean;
  debounceMs?: number;
  fieldConfig?: FieldConfig[];
  operators?: OperatorConfig;
  className?: string;
}

interface FieldConfig {
  value: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  operators?: OperatorType[];
}

interface Condition {
  id: string;
  field: string;
  operator: OperatorType;
  rhsType: "Value" | "Field" | "Param";
  value?: string;
  compareField?: string;
  param?: string;
}
```

## Accessibility

All components include built-in accessibility features:

- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **Focus management** for modal components
- **Semantic HTML** structure
- **High contrast** support
- **Screen reader** announcements for filter changes

## Styling Integration

### With Tailwind CSS

```tsx
<FilterCondition conditionId={condition.id}>
  {({
    condition,
    updateCondition,
    removeCondition,
    fieldOptions,
    operatorOptions,
  }) => (
    <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <select
        value={condition.field}
        onChange={(e) => updateCondition({ field: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {/* options */}
      </select>

      <button
        onClick={removeCondition}
        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  )}
</FilterCondition>
```

### With CSS Modules

```tsx
import styles from "./filter.module.css";

<FilterCondition conditionId={condition.id}>
  {({ condition, updateCondition, removeCondition }) => (
    <div className={styles.conditionRow}>
      <select
        className={styles.fieldSelect}
        value={condition.field}
        onChange={(e) => updateCondition({ field: e.target.value })}
      >
        {/* options */}
      </select>
    </div>
  )}
</FilterCondition>;
```

### With Styled Components

```tsx
import styled from "styled-components";

const ConditionRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

<FilterCondition conditionId={condition.id}>
  {({ condition, updateCondition, removeCondition }) => (
    <ConditionRow>{/* condition controls */}</ConditionRow>
  )}
</FilterCondition>;
```

## Best Practices

1. **Always wrap components in FilterRoot** - Provides necessary context
2. **Use render props for custom styling** - Maximum flexibility
3. **Leverage TypeScript** - Get full autocomplete and type checking
4. **Configure fields upfront** - Better performance and UX
5. **Handle loading states** - Show feedback during API calls
6. **Test with keyboard navigation** - Ensure accessibility
7. **Use semantic HTML** - Better for screen readers
8. **Debounce filter changes** - Avoid excessive API calls

## Migration from Hook-Only Approach

Existing hook users can easily adopt the UI components:

```tsx
// Before (hook only)
const filter = useFilter();
// Manual UI implementation

// After (with UI components)
<FilterRoot>
  <FilterGroup>{/* Automatic UI with full customization */}</FilterGroup>
</FilterRoot>;
```

The hook is still available and used internally by the UI components, so existing code continues to work while new implementations can leverage the UI components for faster development.
