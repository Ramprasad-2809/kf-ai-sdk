# useFilter Hook Documentation

The `useFilter` hook provides a powerful interface for building and managing complex filter conditions that match the official filter specification.

## Key Changes

### ✅ Fixed Issues

1. **Logical operator casing**: Changed from `"AND" | "OR"` to `"And" | "Or" | "Not"` (title case as per spec)
2. **Separated operator types**:
   - `FilterOperator` - for leaf conditions (EQ, NE, GT, etc.)
   - `LogicalOperator` - for combining conditions (And, Or, Not)
3. **Added nested filter support**: Can now build complex nested logical structures
4. **Recursive validation**: Validates nested filter trees

## Basic Usage (Flat Filters)

### Simple Equals Filter

```typescript
const filter = useFilter({
  initialLogicalOperator: "And",
});

// Add a simple condition
const conditionId = filter.addCondition({
  operator: "EQ",
  lhsField: "leave_status",
  rhsValue: "Approved",
  rhsType: "Constant",
});

// Generated API payload:
// {
//   "Operator": "And",
//   "Condition": [
//     {
//       "Operator": "EQ",
//       "LHSField": "leave_status",
//       "RHSValue": "Approved",
//       "RHSType": "Constant"
//     }
//   ]
// }
```

### Multiple Conditions with AND

```typescript
const filter = useFilter({
  initialLogicalOperator: "And",
});

filter.addCondition({
  operator: "IN",
  lhsField: "leave_type",
  rhsValue: ["Casual", "Sick"],
  rhsType: "Constant",
});

filter.addCondition({
  operator: "EQ",
  lhsField: "leave_status",
  rhsValue: "Approved",
  rhsType: "Constant",
});

// Generated API payload:
// {
//   "Operator": "And",
//   "Condition": [
//     {
//       "Operator": "IN",
//       "LHSField": "leave_type",
//       "RHSValue": ["Casual", "Sick"],
//       "RHSType": "Constant"
//     },
//     {
//       "Operator": "EQ",
//       "LHSField": "leave_status",
//       "RHSValue": "Approved",
//       "RHSType": "Constant"
//     }
//   ]
// }
```

## Advanced Usage (Nested Filters)

### Complex Nested: OR with nested AND

Example: (department = "Engineering" AND salary > 80000) OR is_manager = true

```typescript
const filter = useFilter({
  initialLogicalOperator: "Or",
});

// Add a nested AND group
filter.addCondition({
  operator: "And",
  children: [
    {
      id: crypto.randomUUID(),
      operator: "EQ",
      lhsField: "department",
      rhsValue: "Engineering",
      rhsType: "Constant",
      isValid: true,
    },
    {
      id: crypto.randomUUID(),
      operator: "GT",
      lhsField: "salary",
      rhsValue: 80000,
      rhsType: "Constant",
      isValid: true,
    },
  ],
});

// Add a simple condition at the OR level
filter.addCondition({
  operator: "EQ",
  lhsField: "is_manager",
  rhsValue: true,
  rhsType: "Constant",
});

// Generated API payload:
// {
//   "Operator": "Or",
//   "Condition": [
//     {
//       "Operator": "And",
//       "Condition": [
//         {
//           "Operator": "EQ",
//           "LHSField": "department",
//           "RHSValue": "Engineering",
//           "RHSType": "Constant"
//         },
//         {
//           "Operator": "GT",
//           "LHSField": "salary",
//           "RHSValue": 80000,
//           "RHSType": "Constant"
//         }
//       ]
//     },
//     {
//       "Operator": "EQ",
//       "LHSField": "is_manager",
//       "RHSValue": true,
//       "RHSType": "Constant"
//     }
//   ]
// }
```

### Using NOT Operator

Example: NOT (status = "Inactive")

```typescript
const filter = useFilter({
  initialLogicalOperator: "And",
});

filter.addCondition({
  operator: "Not",
  children: [
    {
      id: crypto.randomUUID(),
      operator: "EQ",
      lhsField: "status",
      rhsValue: "Inactive",
      rhsType: "Constant",
      isValid: true,
    },
  ],
});

// Generated API payload:
// {
//   "Operator": "And",
//   "Condition": [
//     {
//       "Operator": "Not",
//       "Condition": [
//         {
//           "Operator": "EQ",
//           "LHSField": "status",
//           "RHSValue": "Inactive",
//           "RHSType": "Constant"
//         }
//       ]
//     }
//   ]
// }
```

## Operator Reference

### Condition Operators (FilterOperator)

#### Common Operators (All field types)

- `EQ` - Equals
- `NE` - Not equals
- `IN` - In list
- `NIN` - Not in list
- `Empty` - Null or empty string
- `NotEmpty` - Not null and not empty

#### Numeric Operators (Number, Long, Date fields)

- `GT` - Greater than
- `GTE` - Greater than or equal
- `LT` - Less than
- `LTE` - Less than or equal
- `Between` - Between two values (requires array of 2)
- `NotBetween` - Not between two values (requires array of 2)

#### String Operators

- `Contains` - String contains substring
- `NotContains` - String does not contain
- `MinLength` - Minimum length
- `MaxLength` - Maximum length

### Logical Operators (LogicalOperator)

- `And` - Combines conditions with AND logic
- `Or` - Combines conditions with OR logic
- `Not` - Negates a condition (single child only)

## RHSType Options

1. **`"Constant"`** - Direct values (strings, numbers, booleans, lists, ranges)
2. **`"BOField"`** - Reference to another field in the business object
3. **`"AppVariable"`** - Reference to application variables

## Validation

The hook automatically validates conditions based on:

1. **Required fields**: operator, lhsField (for conditions)
2. **Operator-specific requirements**:
   - `Between`/`NotBetween`: Requires array of exactly 2 values
   - `IN`/`NIN`: Requires non-empty array
   - `Empty`/`NotEmpty`: No value required
   - Other operators: Value is required
3. **Logical operator requirements**:
   - Must have `children` array
   - `Not` operator: Exactly 1 child
   - `And`/`Or`: At least 1 child
4. **Field-specific validation**: Custom validators via `fieldDefinitions`

## Field Definitions

You can provide field definitions for enhanced validation:

```typescript
const filter = useFilter<MyDataType>({
  fieldDefinitions: {
    salary: {
      type: "number",
      allowedOperators: ["EQ", "GT", "GTE", "LT", "LTE", "Between"],
      validateValue: (value, operator) => {
        if (operator === "Between") {
          if (value[0] >= value[1]) {
            return {
              isValid: false,
              errors: ["First value must be less than second value"],
            };
          }
        }
        return { isValid: true, errors: [] };
      },
    },
    department: {
      type: "select",
      allowedOperators: ["EQ", "NE", "IN", "NIN"],
      selectOptions: [
        { label: "Engineering", value: "Engineering" },
        { label: "Sales", value: "Sales" },
        { label: "HR", value: "HR" },
      ],
    },
  },
});
```

## useFilter with useTable

The `useTable` hook integrates `useFilter` automatically:

```typescript
const table = useTable({
  source: "employees",
  columns: [...],
  fieldDefinitions: {
    salary: {
      type: 'number',
      allowedOperators: ['GT', 'LT', 'Between']
    }
  },
  initialState: {
    filterOperator: "And",
    filters: [
      {
        id: crypto.randomUUID(),
        operator: "GT",
        lhsField: "salary",
        rhsValue: 50000,
        isValid: true
      }
    ]
  }
});

// Access filter methods
table.filter.addCondition({
  operator: "EQ",
  lhsField: "department",
  rhsValue: "Engineering"
});

table.filter.setLogicalOperator("Or");
```

## API Payload Generation

The hook automatically generates the correct API payload format:

```typescript
const { filterPayload } = useFilter();

// Use in API call
const response = await api("employees").list({
  Type: "List",
  Field: ["name", "salary", "department"],
  Filter: filterPayload, // Automatically formatted
  Sort: [{ name: "ASC" }],
});
```

## Migration Guide

If you were using the old hook with `"AND"` / `"OR"`:

### Before:

```typescript
filter.setLogicalOperator("AND");
// OR
filter.setLogicalOperator("OR");
```

### After:

```typescript
filter.setLogicalOperator("And");
// OR
filter.setLogicalOperator("Or");
// OR (new!)
filter.setLogicalOperator("Not");
```

**Note**: The API now expects title case (`"And"`, `"Or"`, `"Not"`) instead of uppercase (`"AND"`, `"OR"`).

## Complete Examples from Spec

### Example 1: Between Operator (Range)

```typescript
filter.addCondition({
  operator: "Between",
  lhsField: "salary",
  rhsValue: [50000, 100000],
  rhsType: "Constant",
});
```

### Example 2: String Contains

```typescript
filter.addCondition({
  operator: "Contains",
  lhsField: "name",
  rhsValue: "John",
  rhsType: "Constant",
});
```

### Example 3: Field Reference (BOField)

```typescript
filter.addCondition({
  operator: "GT",
  lhsField: "end_date",
  rhsValue: "start_date",
  rhsType: "BOField", // Compare end_date > start_date
});
```

### Example 4: App Variable

```typescript
filter.addCondition({
  operator: "EQ",
  lhsField: "department",
  rhsValue: "current_user_department",
  rhsType: "AppVariable",
});
```

## Benefits

✅ **Type-safe**: Full TypeScript support with discriminated unions
✅ **Spec-compliant**: Matches official API specification exactly
✅ **Flexible**: Supports both simple and complex nested filters
✅ **Validated**: Automatic validation with detailed error messages
✅ **Extensible**: Custom field validators and transformers
✅ **Integrated**: Works seamlessly with useTable hook
