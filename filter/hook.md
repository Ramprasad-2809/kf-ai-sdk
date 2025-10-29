# useFilter Hook API Reference

Complete documentation for the headless filter builder hook and methods.

## useFilter(initialFilter?)

Returns a filter builder instance with properties and methods for managing filter state.

### Parameters

- `initialFilter?: FilterJSON` - Optional initial filter to populate the builder

### Return Value

The hook returns an object with the following properties and methods:

## Properties

| Property      | Type          | Description                           |
| ------------- | ------------- | ------------------------------------- |
| `filterState` | `FilterState` | Current state of the filter           |
| `json`        | `object`      | Generated JSON in API format          |
| `summary`     | `string[]`    | Human-readable summary of the filter  |
| `isEmpty`     | `boolean`     | Whether the filter has any conditions |
| `rootGroup`   | `FilterGroup` | The root group for UI rendering       |

## Methods

### Condition Management

#### addCondition(groupId?, condition?) → string

Adds a new condition to the specified group or root level.

```tsx
const conditionId = filter.addCondition(null, {
  field: "name",
  operator: "CONTAINS",
  value: "john",
});
```

**Parameters:**

- `groupId?: string` - Target group ID (null for root level)
- `condition?: Partial<Condition>` - Condition configuration

**Returns:** `string` - Generated condition ID

#### updateCondition(conditionId, updates) → void

Updates an existing condition with new properties.

```tsx
filter.updateCondition("condition-123", {
  operator: "EQUALS",
  value: "jane",
});
```

**Parameters:**

- `conditionId: string` - ID of condition to update
- `updates: Partial<Condition>` - Properties to update

#### removeCondition(conditionId) → void

Removes a condition from the filter.

```tsx
filter.removeCondition("condition-123");
```

**Parameters:**

- `conditionId: string` - ID of condition to remove

### Group Management

#### addGroup(parentGroupId?, operator?) → string

Creates a new group for organizing conditions.

```tsx
const groupId = filter.addGroup(null, "OR");
```

**Parameters:**

- `parentGroupId?: string` - Parent group ID (null for root level)
- `operator?: 'AND' | 'OR'` - Logical operator (default: 'AND')

**Returns:** `string` - Generated group ID

#### updateGroup(groupId, updates) → void

Updates group properties.

```tsx
filter.updateGroup("group-123", { operator: "OR" });
```

**Parameters:**

- `groupId: string` - ID of group to update
- `updates: Partial<FilterGroup>` - Properties to update

#### removeGroup(groupId) → void

Removes a group and all its contents.

```tsx
filter.removeGroup("group-123");
```

**Parameters:**

- `groupId: string` - ID of group to remove

#### toggleGroupOperator(groupId) → void

Toggles group operator between AND/OR.

```tsx
filter.toggleGroupOperator("group-123");
```

**Parameters:**

- `groupId: string` - ID of group to toggle

### Utilities

#### clear() → void

Removes all conditions and groups, resetting the filter.

```tsx
filter.clear();
```

## Data Types

### Condition

```tsx
interface Condition {
  id: string;
  field: string;
  operator: ComparisonOperator;
  rhsType: "Value" | "Field" | "Param";
  value?: string;
  compareField?: string;
  param?: string;
}
```

### FilterGroup

```tsx
interface FilterGroup {
  id: string;
  operator: "AND" | "OR";
  conditions: Condition[];
  groups: FilterGroup[];
}
```

### ComparisonOperator

```tsx
type ComparisonOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "GREATER_THAN"
  | "LESS_THAN"
  | "GREATER_THAN_OR_EQUAL_TO"
  | "LESS_THAN_OR_EQUAL_TO"
  | "IS_NULL"
  | "IS_NOT_NULL";
```

## Supported Operators

| Operator                   | Description           | Applicable Types |
| -------------------------- | --------------------- | ---------------- |
| `EQUALS`                   | Exact match           | All types        |
| `NOT_EQUALS`               | Not equal to          | All types        |
| `CONTAINS`                 | Contains substring    | Text             |
| `NOT_CONTAINS`             | Does not contain      | Text             |
| `GREATER_THAN`             | Greater than          | Number, Date     |
| `LESS_THAN`                | Less than             | Number, Date     |
| `GREATER_THAN_OR_EQUAL_TO` | Greater than or equal | Number, Date     |
| `LESS_THAN_OR_EQUAL_TO`    | Less than or equal    | Number, Date     |
| `IS_NULL`                  | Is null/empty         | All types        |
| `IS_NOT_NULL`              | Is not null/empty     | All types        |

## RHS Types

| Type    | Description               | Required Property | Use Case                       |
| ------- | ------------------------- | ----------------- | ------------------------------ |
| `Value` | Static value comparison   | `value`           | Compare against literal values |
| `Field` | Field-to-field comparison | `compareField`    | Compare against other fields   |
| `Param` | Dynamic parameter         | `param`           | Runtime parameter substitution |

## Usage Examples

### Basic Conditions

```tsx
const filter = useFilter();

// Text search
filter.addCondition(null, {
  field: "name",
  operator: "CONTAINS",
  value: "john",
});

// Exact match
filter.addCondition(null, {
  field: "status",
  operator: "EQUALS",
  value: "active",
});

// Numeric comparison
filter.addCondition(null, {
  field: "age",
  operator: "GREATER_THAN",
  value: "18",
});
```

### Nested Groups

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

// Add condition to root level (AND with group)
filter.addCondition(null, {
  field: "isActive",
  operator: "EQUALS",
  value: "true",
});

// Result: (role = 'admin' OR role = 'moderator') AND isActive = true
```

### Field Comparisons

```tsx
const filter = useFilter();

// Compare two date fields
filter.addCondition(null, {
  field: "endDate",
  operator: "GREATER_THAN",
  rhsType: "Field",
  compareField: "startDate",
});

// Compare with parameter
filter.addCondition(null, {
  field: "userId",
  operator: "EQUALS",
  rhsType: "Param",
  param: "currentUserId",
});
```

### Loading Existing Filters

```tsx
// From API response
const existingFilter = {
  AND: [
    {
      LHSField: "status",
      Operator: "EQUALS",
      RHSType: "Value",
      RHSValue: "active",
      RHSField: null,
      RHSParam: "",
      Id: "Condition-123",
    },
  ],
};

// Initialize with existing filter
const filter = useFilter(existingFilter);

// Modify the loaded filter
filter.addCondition(null, {
  field: "department",
  operator: "EQUALS",
  value: "engineering",
});
```

### State Management

```tsx
const filter = useFilter();

// Check filter state
if (filter.isEmpty) {
  console.log("No filters applied");
} else {
  console.log(`Filter has ${filter.summary.length} conditions`);
}

// Get human-readable summary
filter.summary.forEach((line) => console.log(line));

// Access raw state
console.log(filter.filterState);
console.log(filter.rootGroup);
```

## Error Handling

The hook performs basic validation and will:

- Generate unique IDs automatically
- Handle invalid group/condition IDs gracefully
- Maintain consistent state during updates
- Provide empty results for invalid operations

For production use, implement additional validation:

```tsx
const filter = useFilter();

// Validate field names
const validFields = ["name", "email", "status", "age"];
const field = "name";

if (validFields.includes(field)) {
  filter.addCondition(null, {
    field,
    operator: "CONTAINS",
    value: "john",
  });
} else {
  console.error(`Invalid field: ${field}`);
}
```

## Performance Considerations

- The hook uses React state internally and will trigger re-renders on changes
- Use `useCallback` for event handlers when passing to child components
- Consider debouncing API calls when filters change frequently
- The generated JSON is computed on every render - cache if needed for performance

```tsx
const filter = useFilter();
const [debouncedJson, setDebouncedJson] = useState(filter.json);

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedJson(filter.json);
  }, 300);

  return () => clearTimeout(timer);
}, [filter.json]);

// Use debouncedJson for API calls
```

---

# Advanced Usage Patterns

## Parsing Existing Filters

Initialize the filter builder with existing filter JSON from your API.

```tsx
// From API response
const existingFilter = {
  AND: [{ LHSField: "status", Operator: "EQUALS", RHSValue: "active" }],
};

const filter = useFilter(existingFilter);
// Filter is pre-populated with existing conditions
```

## Programmatic Filter Building

Build complex filters programmatically using loops and conditions.

```tsx
function buildComplexFilter() {
  const filter = useFilter();

  // Root is AND by default
  const mainGroup = filter.rootGroup.id;

  // Add base conditions
  filter.addCondition(mainGroup, {
    field: "type",
    operator: "EQUALS",
    value: "premium",
  });

  // Create OR group for status
  const statusGroup = filter.addGroup(mainGroup, "OR");
  ["active", "pending"].forEach((status) => {
    filter.addCondition(statusGroup, {
      field: "status",
      operator: "EQUALS",
      value: status,
    });
  });

  return filter.json;
}
```

## Integration with Form Libraries

### React Hook Form Integration

```tsx
import { useForm } from "react-hook-form";

function FilterForm() {
  const filter = useFilter();
  const { register, watch } = useForm();
  const formValues = watch();

  useEffect(() => {
    filter.clear();

    // Build filter from form values
    Object.entries(formValues).forEach(([field, value]) => {
      if (value) {
        filter.addCondition(null, {
          field,
          operator: "CONTAINS",
          value: String(value),
        });
      }
    });
  }, [formValues]);

  return (
    <form>
      <input {...register("name")} placeholder="Name" />
      <input {...register("email")} placeholder="Email" />
      {/* Filter automatically updates as form changes */}
    </form>
  );
}
```

## Field Configuration

Configure available fields and their properties for validation and UI generation.

### Basic Field Configuration

```tsx
const fieldConfig = [
  {
    name: "name",
    label: "Name",
    type: "text",
    operators: ["CONTAINS", "EQUALS", "NOT_EQUALS"],
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["active", "inactive", "pending"],
    operators: ["EQUALS", "NOT_EQUALS"],
  },
  {
    name: "age",
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
    name: "created_at",
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

// Use in UI components for validation and operator filtering
function getValidOperators(fieldName) {
  const field = fieldConfig.find((f) => f.name === fieldName);
  return field ? field.operators : [];
}
```

### Advanced Field Configuration with Validation

```tsx
const advancedFieldConfig = [
  {
    name: "email",
    label: "Email Address",
    type: "text",
    operators: ["CONTAINS", "EQUALS", "NOT_EQUALS"],
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Must be a valid email address",
    },
  },
  {
    name: "salary",
    label: "Salary",
    type: "number",
    operators: [
      "EQUALS",
      "GREATER_THAN",
      "LESS_THAN",
      "GREATER_THAN_OR_EQUAL_TO",
      "LESS_THAN_OR_EQUAL_TO",
    ],
    validation: {
      min: 0,
      max: 1000000,
      message: "Salary must be between 0 and 1,000,000",
    },
    format: (value) => `$${Number(value).toLocaleString()}`,
  },
  {
    name: "department",
    label: "Department",
    type: "select",
    options: [
      { value: "eng", label: "Engineering" },
      { value: "marketing", label: "Marketing" },
      { value: "sales", label: "Sales" },
    ],
    operators: ["EQUALS", "NOT_EQUALS"],
  },
];

// Validation helper
function validateCondition(condition, fieldConfig) {
  const field = fieldConfig.find((f) => f.name === condition.field);
  if (!field) return { valid: false, message: "Invalid field" };

  if (field.validation) {
    const { pattern, min, max, message } = field.validation;

    if (pattern && !pattern.test(condition.value)) {
      return { valid: false, message };
    }

    if (
      (min !== undefined && Number(condition.value) < min) ||
      (max !== undefined && Number(condition.value) > max)
    ) {
      return { valid: false, message };
    }
  }

  return { valid: true };
}
```

## Complex Nesting Patterns

### Multi-Level Filtering

```tsx
function buildComplexNestedFilter() {
  const filter = useFilter();

  // Main AND group: All conditions must be met
  const mainGroup = filter.addGroup(null, "AND");

  // User must be active
  filter.addCondition(mainGroup, {
    field: "status",
    operator: "EQUALS",
    value: "active",
  });

  // Role-based OR group: Admin OR (Manager AND in Engineering)
  const roleGroup = filter.addGroup(mainGroup, "OR");

  // Admin users
  filter.addCondition(roleGroup, {
    field: "role",
    operator: "EQUALS",
    value: "admin",
  });

  // Manager in Engineering
  const managerGroup = filter.addGroup(roleGroup, "AND");
  filter.addCondition(managerGroup, {
    field: "role",
    operator: "EQUALS",
    value: "manager",
  });
  filter.addCondition(managerGroup, {
    field: "department",
    operator: "EQUALS",
    value: "engineering",
  });

  // Date-based OR group: Recent activity OR high priority
  const activityGroup = filter.addGroup(mainGroup, "OR");

  // Recent login
  filter.addCondition(activityGroup, {
    field: "last_login",
    operator: "GREATER_THAN",
    value: "2023-01-01",
  });

  // High priority tasks
  filter.addCondition(activityGroup, {
    field: "priority",
    operator: "EQUALS",
    value: "high",
  });

  // Result:
  // status = 'active' AND
  // (role = 'admin' OR (role = 'manager' AND department = 'engineering')) AND
  // (last_login > '2023-01-01' OR priority = 'high')

  return filter.json;
}
```

### Dynamic Filter Templates

```tsx
const filterTemplates = {
  activeEngineers: {
    name: "Active Engineers",
    description: "Active users in engineering department",
    build: (filter) => {
      const engineeringGroup = filter.addGroup(null, "AND");
      filter.addCondition(engineeringGroup, {
        field: "status",
        operator: "EQUALS",
        value: "active",
      });
      filter.addCondition(engineeringGroup, {
        field: "department",
        operator: "EQUALS",
        value: "engineering",
      });
    },
  },

  recentHighValue: {
    name: "Recent High-Value Users",
    description: "Users who joined recently with high engagement",
    build: (filter) => {
      const recentGroup = filter.addGroup(null, "AND");
      filter.addCondition(recentGroup, {
        field: "created_at",
        operator: "GREATER_THAN",
        value: "2023-01-01",
      });
      filter.addCondition(recentGroup, {
        field: "engagement_score",
        operator: "GREATER_THAN",
        value: "80",
      });
    },
  },
};

function applyTemplate(templateName) {
  const filter = useFilter();
  const template = filterTemplates[templateName];

  if (template) {
    template.build(filter);
  }

  return filter;
}
```

## Performance Optimization

### Debounced Filter Updates

```tsx
function useDebouncedFilter(delayMs = 300) {
  const filter = useFilter();
  const [debouncedJson, setDebouncedJson] = useState(filter.json);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedJson(filter.json);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [filter.json, delayMs]);

  return {
    filter,
    debouncedJson,
    isDebouncing: filter.json !== debouncedJson,
  };
}

// Usage
function OptimizedFilterComponent() {
  const { filter, debouncedJson, isDebouncing } = useDebouncedFilter(500);

  useEffect(() => {
    if (debouncedJson && Object.keys(debouncedJson).length > 0) {
      // Make API call with debounced filter
      fetchData(debouncedJson);
    }
  }, [debouncedJson]);

  return (
    <div>
      {/* Filter UI */}
      {isDebouncing && <div>Updating filter...</div>}
    </div>
  );
}
```

### Memoized Filter Components

```tsx
const MemoizedFilterCondition = React.memo(function FilterCondition({
  condition,
  onUpdate,
  onRemove,
  fieldOptions,
  operatorOptions,
}) {
  const handleFieldChange = useCallback(
    (field) => {
      onUpdate({ field });
    },
    [onUpdate]
  );

  const handleOperatorChange = useCallback(
    (operator) => {
      onUpdate({ operator });
    },
    [onUpdate]
  );

  const handleValueChange = useCallback(
    (value) => {
      onUpdate({ value });
    },
    [onUpdate]
  );

  return <div className="filter-condition">{/* Condition UI */}</div>;
});

// Usage with memoized callbacks
function FilterBuilder() {
  const filter = useFilter();

  const handleConditionUpdate = useCallback(
    (conditionId, updates) => {
      filter.updateCondition(conditionId, updates);
    },
    [filter]
  );

  const handleConditionRemove = useCallback(
    (conditionId) => {
      filter.removeCondition(conditionId);
    },
    [filter]
  );

  return (
    <div>
      {filter.rootGroup.conditions.map((condition) => (
        <MemoizedFilterCondition
          key={condition.id}
          condition={condition}
          onUpdate={(updates) => handleConditionUpdate(condition.id, updates)}
          onRemove={() => handleConditionRemove(condition.id)}
          fieldOptions={fieldOptions}
          operatorOptions={operatorOptions}
        />
      ))}
    </div>
  );
}
```
