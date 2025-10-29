# Filter SDK

A headless React hook for building complex filter queries with nested AND/OR logic. This component abstracts away complex JSON filter structures and provides a simple, intuitive API for developers.

## Core Concepts

### Groups

Containers that combine conditions with AND/OR logic. Groups can be nested to create complex filter hierarchies. The root level acts as a group, and you can create nested groups for advanced filtering scenarios.

### Conditions

Individual filter rules composed of a field, operator, and value. Each condition represents a single filtering criterion like "name contains 'john'" or "age greater than 18".

### Operators

Comparison operators that define how the field value should be evaluated. Includes text operators (CONTAINS, EQUALS), numeric operators (GREATER_THAN, LESS_THAN), and null checks (IS_NULL, IS_NOT_NULL).

## Quick Start

```tsx
import { useFilter } from "@kf-ai-sdk/headless-filter";

function MyComponent() {
  const filter = useFilter();

  // Add simple conditions
  filter.addCondition(null, {
    field: "name",
    operator: "CONTAINS",
    value: "john",
  });

  filter.addCondition(null, {
    field: "status",
    operator: "EQUALS",
    value: "active",
  });

  // Use filter with Table SDK for automatic data fetching
  const table = useTable({
    source: "users",
    filter: filter.json, // Table automatically handles React Query with filters
    enableFiltering: true,
  });

  return (
    <div>
      {/* Filter controls */}
      <div>
        <button onClick={() => filter.clear()}>Clear Filters</button>
        <span>Active conditions: {filter.conditionCount}</span>
      </div>

      {/* Results via Table SDK */}
      {table.isLoading && <div>Loading filtered data...</div>}
      {table.rows.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Generated JSON

The hook automatically generates JSON in this format:

```json
{
  "AND": [
    {
      "LHSField": "name",
      "Operator": "CONTAINS",
      "RHSType": "Value",
      "RHSValue": "john",
      "RHSField": null,
      "RHSParam": "",
      "Id": "Condition-abc123"
    },
    {
      "LHSField": "status",
      "Operator": "EQUALS",
      "RHSType": "Value",
      "RHSValue": "active",
      "RHSField": null,
      "RHSParam": "",
      "Id": "Condition-def456"
    }
  ]
}
```

## Quick Examples

### Multiple Conditions (AND Logic)

```tsx
const filter = useFilter();

filter.addCondition(null, {
  field: "age",
  operator: "GREATER_THAN",
  value: "18",
});
filter.addCondition(null, {
  field: "status",
  operator: "EQUALS",
  value: "active",
});

// Generates: age > 18 AND status = 'active'
```

### Nested Groups (Complex Logic)

```tsx
const filter = useFilter();

// Create OR group for roles
const roleGroup = filter.addGroup(null, "OR");
filter.addCondition(roleGroup, {
  field: "role",
  operator: "EQUALS",
  value: "admin",
});
filter.addCondition(roleGroup, {
  field: "role",
  operator: "EQUALS",
  value: "moderator",
});

// Add condition to root (AND with the group)
filter.addCondition(null, {
  field: "isActive",
  operator: "EQUALS",
  value: "true",
});

// Generates: (role = 'admin' OR role = 'moderator') AND isActive = true
```

### Field-to-Field Comparison

```tsx
const filter = useFilter();

filter.addCondition(null, {
  field: "endDate",
  operator: "GREATER_THAN",
  rhsType: "Field",
  compareField: "startDate",
});

// Generates: endDate > startDate
```

## Documentation

- **[Hook API Reference](hook.md)** - Complete useFilter API documentation with advanced patterns
- **[UI Components](components.md)** - Headless UI components and complete implementation examples

## Features

- ✅ **Nested Groups** - Complex AND/OR logic with unlimited nesting
- ✅ **Field Comparison** - Compare fields against other fields or parameters
- ✅ **Type Safe** - Complete TypeScript support with intelligent types
- ✅ **Flexible Operators** - Text, numeric, date, and null comparison operators
- ✅ **JSON Generation** - Automatic conversion to backend-ready filter JSON
- ✅ **React Hooks** - Modern React patterns with state management
- ✅ **Headless UI** - Unstyled components for complete design control
