# useForm Hook Documentation

The `useForm` hook is a powerful form management solution that integrates React Hook Form with backend-driven schemas and validation. It automatically fetches field definitions from your backend, applies complex validation rules, and handles form submission with type safety.

## Table of Contents

- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Backend Schema Integration](#backend-schema-integration)
- [Validation System](#validation-system)
- [Expression Trees](#expression-trees)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Usage

```tsx
import { useForm } from '@kf-ai-sdk/hooks';

function MyForm() {
  const form = useForm({
    source: 'user',
    operation: 'create',
    onSuccess: (data) => console.log('Created:', data),
    onError: (error) => console.error('Error:', error)
  });

  if (form.isLoadingInitialData) {
    return <div>Loading form schema...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register('firstName')} placeholder="First Name" />
      {form.formState.errors.firstName && (
        <span>{form.formState.errors.firstName.message}</span>
      )}
      
      <input {...form.register('email')} placeholder="Email" />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### Update Form

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const form = useForm({
    source: 'user',
    operation: 'update',
    recordId: userId,
    onSuccess: (data) => console.log('Updated:', data)
  });

  // Form renders with existing data pre-filled
  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Fields will be populated with existing user data */}
      <input {...form.register('firstName')} />
      <input {...form.register('email')} />
      <button type="submit">Update User</button>
    </form>
  );
}
```

## API Reference

### useForm(options)

The main hook for form management.

#### Parameters

```typescript
interface UseFormOptions<T = any> {
  /** Data source identifier (Business Object name) */
  source: string;
  
  /** Form operation type */
  operation: 'create' | 'update';
  
  /** Record ID for update operations */
  recordId?: string;
  
  /** Default form values */
  defaultValues?: Partial<T>;
  
  /** Validation mode (default: 'onBlur') */
  mode?: 'onBlur' | 'onChange' | 'onSubmit';
  
  /** Success callback */
  onSuccess?: (data: T) => void;
  
  /** Error callback */
  onError?: (error: Error) => void;
  
  /** Schema load error callback */
  onSchemaError?: (error: Error) => void;
  
  /** Submit error callback */
  onSubmitError?: (error: Error) => void;
  
  /** Custom validation rules */
  customValidation?: Record<keyof T, any>;
  
  /** Skip schema fetching (for testing) */
  skipSchemaFetch?: boolean;
  
  /** Manual schema (use instead of fetching) */
  schema?: BackendSchema;
}
```

#### Return Value

```typescript
interface UseFormReturn<T = any> {
  // React Hook Form integration
  register: UseFormRegister<T>;
  handleSubmit: UseFormHandleSubmit<T>;
  formState: FormState<T>;
  watch: UseFormWatch<T>;
  setValue: UseFormSetValue<T>;
  reset: UseFormReset<T>;
  
  // Loading states
  isLoadingInitialData: boolean;
  isLoadingRecord: boolean;
  isSubmitting: boolean;
  isLoading: boolean;
  
  // Error handling
  loadError: Error | null;
  submitError: Error | null;
  hasError: boolean;
  
  // Schema information
  schema: BackendSchema | null;
  processedSchema: ProcessedSchema | null;
  computedFields: string[];
  requiredFields: string[];
  
  // Field helpers
  getField: (fieldName: keyof T) => ProcessedField | null;
  getFields: () => Record<string, ProcessedField>;
  hasField: (fieldName: keyof T) => boolean;
  isFieldRequired: (fieldName: keyof T) => boolean;
  isFieldComputed: (fieldName: keyof T) => boolean;
  
  // Operations
  submit: () => Promise<void>;
  refreshSchema: () => Promise<void>;
  validateForm: () => Promise<boolean>;
  clearErrors: () => void;
}
```

## Backend Schema Integration

The `useForm` hook automatically fetches field definitions from your backend using the endpoint:

```
GET /api/bo/{source}/field
```

### Expected Schema Format

The backend should return a JSON object with field definitions:

```json
{
  "FirstName": {
    "Type": "String",
    "Required": true,
    "Validation": [
      {
        "Id": "VAL_FIRSTNAME_001",
        "Type": "Expression",
        "Condition": {
          "Expression": "LENGTH(TRIM(FirstName)) >= 2",
          "ExpressionTree": {
            "Type": "BinaryExpression",
            "Operator": ">=",
            "Arguments": [
              {
                "Type": "CallExpression",
                "Callee": "LENGTH",
                "Arguments": [
                  {
                    "Type": "CallExpression",
                    "Callee": "TRIM",
                    "Arguments": [
                      {
                        "Type": "Identifier",
                        "Name": "FirstName",
                        "Source": "BO_User"
                      }
                    ]
                  }
                ]
              },
              {
                "Type": "Literal",
                "Value": 2
              }
            ]
          }
        },
        "Message": "First name must be at least 2 characters"
      }
    ]
  },
  "Email": {
    "Type": "String",
    "Required": true,
    "Unique": true,
    "Validation": [
      {
        "Id": "VAL_EMAIL_001",
        "Type": "Expression",
        "Condition": {
          "Expression": "CONTAINS(Email, '@')",
          "ExpressionTree": {
            "Type": "CallExpression",
            "Callee": "CONTAINS",
            "Arguments": [
              {
                "Type": "Identifier",
                "Name": "Email",
                "Source": "BO_User"
              },
              {
                "Type": "Literal",
                "Value": "@"
              }
            ]
          }
        },
        "Message": "Please enter a valid email address"
      }
    ]
  }
}
```

### Field Types

Supported backend field types:

- **String**: Text input fields
- **Number**: Numeric input fields
- **Boolean**: Checkbox fields
- **Date**: Date picker fields
- **DateTime**: Date and time picker fields
- **Reference**: Select fields with data from other objects
- **Array**: Multi-value fields
- **Object**: Complex nested structures

### Field Properties

- `Type`: Field data type
- `Required`: Whether the field is mandatory
- `Unique`: Whether the field value must be unique
- `DefaultValue`: Expression for default value calculation
- `Formula`: Expression for computed field calculation
- `Computed`: Whether the field is read-only (calculated)
- `Validation`: Array of validation rules
- `Values`: Options for select/reference fields
- `Description`: Help text for the field

## Validation System

The hook supports multiple types of validation:

### 1. Basic Validation

```typescript
// Required fields
{
  "Required": true
}

// Type validation (automatic based on field type)
{
  "Type": "Number" // Automatically validates numeric input
}
```

### 2. Expression-Based Validation

Backend validation rules use expression trees for complex logic:

```json
{
  "Validation": [
    {
      "Id": "VAL_AGE_001",
      "Type": "Expression",
      "Condition": {
        "Expression": "Age >= 18 AND Age <= 120",
        "ExpressionTree": {
          "Type": "LogicalExpression",
          "Operator": "AND",
          "Arguments": [
            {
              "Type": "BinaryExpression",
              "Operator": ">=",
              "Arguments": [
                {
                  "Type": "Identifier",
                  "Name": "Age",
                  "Source": "BO_User"
                },
                {
                  "Type": "Literal",
                  "Value": 18
                }
              ]
            },
            {
              "Type": "BinaryExpression",
              "Operator": "<=",
              "Arguments": [
                {
                  "Type": "Identifier",
                  "Name": "Age",
                  "Source": "BO_User"
                },
                {
                  "Type": "Literal",
                  "Value": 120
                }
              ]
            }
          ]
        }
      },
      "Message": "Age must be between 18 and 120"
    }
  ]
}
```

### 3. Cross-Field Validation

Validate relationships between fields:

```json
{
  "EndDate": {
    "Type": "Date",
    "Required": true,
    "Validation": [
      {
        "Id": "VAL_END_DATE_001",
        "Type": "Expression",
        "Condition": {
          "Expression": "EndDate >= StartDate",
          "ExpressionTree": {
            "Type": "BinaryExpression",
            "Operator": ">=",
            "Arguments": [
              {
                "Type": "Identifier",
                "Name": "EndDate",
                "Source": "BO_LeaveRequest"
              },
              {
                "Type": "Identifier",
                "Name": "StartDate",
                "Source": "BO_LeaveRequest"
              }
            ]
          }
        },
        "Message": "End date must be on or after start date"
      }
    ]
  }
}
```

## Expression Trees

Expression trees are the backbone of the validation system. They represent complex logic as nested objects that can be evaluated at runtime.

### Supported Expression Types

#### 1. Literal Values

```json
{
  "Type": "Literal",
  "Value": "Hello World" // string, number, boolean, or null
}
```

#### 2. Field References

```json
{
  "Type": "Identifier",
  "Name": "FieldName",
  "Source": "BO_ObjectName"
}
```

#### 3. System Values

```json
{
  "Type": "SystemIdentifier",
  "Name": "NOW" // NOW, TODAY, CURRENT_USER, etc.
}
```

#### 4. Function Calls

```json
{
  "Type": "CallExpression",
  "Callee": "LENGTH",
  "Arguments": [
    {
      "Type": "Identifier",
      "Name": "FirstName",
      "Source": "BO_User"
    }
  ]
}
```

#### 5. Binary Operations

```json
{
  "Type": "BinaryExpression",
  "Operator": ">=",
  "Arguments": [
    {
      "Type": "Identifier",
      "Name": "Age",
      "Source": "BO_User"
    },
    {
      "Type": "Literal",
      "Value": 18
    }
  ]
}
```

#### 6. Logical Operations

```json
{
  "Type": "LogicalExpression",
  "Operator": "AND",
  "Arguments": [
    {
      "Type": "BinaryExpression",
      "Operator": ">=",
      "Arguments": [...]
    },
    {
      "Type": "BinaryExpression",
      "Operator": "<=",
      "Arguments": [...]
    }
  ]
}
```

### Built-in Functions

The expression evaluator supports many built-in functions:

#### String Functions
- `CONCAT(str1, str2, ...)`: Concatenate strings
- `TRIM(str)`: Remove leading/trailing whitespace
- `LENGTH(str)`: Get string length
- `UPPER(str)`: Convert to uppercase
- `LOWER(str)`: Convert to lowercase
- `SUBSTRING(str, start, length)`: Extract substring

#### Date Functions
- `NOW`: Current date and time
- `TODAY`: Current date (no time)
- `YEAR(date)`: Extract year
- `MONTH(date)`: Extract month
- `DAY(date)`: Extract day
- `DATE_DIFF(date1, date2)`: Calculate difference in days
- `ADD_DAYS(date, days)`: Add days to date
- `ADD_MONTHS(date, months)`: Add months to date

#### Math Functions
- `SUM(n1, n2, ...)`: Sum numbers
- `AVG(n1, n2, ...)`: Average numbers
- `MIN(n1, n2, ...)`: Minimum value
- `MAX(n1, n2, ...)`: Maximum value
- `ROUND(num)`: Round to nearest integer
- `FLOOR(num)`: Round down
- `CEIL(num)`: Round up
- `ABS(num)`: Absolute value

#### Conditional Functions
- `IF(condition, trueValue, falseValue)`: Conditional expression

#### Validation Functions
- `IS_NULL(value)`: Check if null/undefined
- `IS_EMPTY(str)`: Check if empty string
- `IS_NUMBER(value)`: Check if numeric
- `IS_DATE(value)`: Check if valid date

## Advanced Usage

### Computed Fields

Fields can be automatically calculated based on other fields:

```json
{
  "FullName": {
    "Type": "String",
    "Formula": {
      "Expression": "CONCAT(FirstName, ' ', LastName)",
      "ExpressionTree": {
        "Type": "CallExpression",
        "Callee": "CONCAT",
        "Arguments": [
          {
            "Type": "Identifier",
            "Name": "FirstName",
            "Source": "BO_User"
          },
          {
            "Type": "Literal",
            "Value": " "
          },
          {
            "Type": "Identifier",
            "Name": "LastName",
            "Source": "BO_User"
          }
        ]
      }
    },
    "Computed": true
  }
}
```

```tsx
// In your component
function UserForm() {
  const form = useForm({ source: 'user', operation: 'create' });

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register('FirstName')} placeholder="First Name" />
      <input {...form.register('LastName')} placeholder="Last Name" />
      
      {/* Computed field - automatically calculated */}
      <div>Full Name: {form.watch('FullName')}</div>
      
      <button type="submit">Create User</button>
    </form>
  );
}
```

### Reference Fields

Fields can reference data from other objects:

```json
{
  "DepartmentId": {
    "Type": "Reference",
    "Values": {
      "Mode": "Dynamic",
      "Reference": {
        "BusinessObject": "BO_Department",
        "Fields": ["_id", "Name", "Description"],
        "Filters": {
          "Condition": [
            {
              "LhsField": "IsActive",
              "Operator": "EQ",
              "RhsType": "Value",
              "RhsValue": true
            }
          ]
        },
        "Sort": [
          {
            "Field": "Name",
            "Order": "ASC"
          }
        ]
      }
    }
  }
}
```

```tsx
// In your component
function UserForm() {
  const form = useForm({ source: 'user', operation: 'create' });

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Reference field renders as select */}
      <select {...form.register('DepartmentId')}>
        <option value="">Select Department</option>
        {form.getField('DepartmentId')?.options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      <button type="submit">Create User</button>
    </form>
  );
}
```

### Field Helpers

The hook provides utilities to work with field metadata:

```tsx
function UserForm() {
  const form = useForm({ source: 'user', operation: 'create' });

  return (
    <form onSubmit={form.handleSubmit()}>
      {Object.entries(form.getFields()).map(([fieldName, field]) => (
        <div key={fieldName}>
          <label>
            {field.label}
            {form.isFieldRequired(fieldName) && ' *'}
          </label>
          
          {field.type === 'select' ? (
            <select {...form.register(fieldName)}>
              <option value="">Choose...</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              {...form.register(fieldName)}
              type={field.type}
              placeholder={field.description}
              readOnly={form.isFieldComputed(fieldName)}
            />
          )}
          
          {form.formState.errors[fieldName] && (
            <span className="error">
              {form.formState.errors[fieldName].message}
            </span>
          )}
        </div>
      ))}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Error Handling

Comprehensive error handling for different scenarios:

```tsx
function UserForm() {
  const form = useForm({
    source: 'user',
    operation: 'create',
    onError: (error) => {
      // Global error handler
      console.error('Form error:', error);
    },
    onSchemaError: (error) => {
      // Schema loading errors
      console.error('Schema error:', error);
    },
    onSubmitError: (error) => {
      // Form submission errors
      console.error('Submit error:', error);
    }
  });

  // Show loading state
  if (form.isLoadingInitialData) {
    return <div>Loading form schema...</div>;
  }

  // Show schema error
  if (form.loadError) {
    return (
      <div className="error">
        <h3>Error Loading Form</h3>
        <p>{form.loadError.message}</p>
        <button onClick={() => form.refreshSchema()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Form fields */}
      
      {/* Submit error */}
      {form.submitError && (
        <div className="error">
          {form.submitError.message}
        </div>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

## Best Practices

### 1. Use TypeScript

Define your form data types for better development experience:

```tsx
interface User {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  departmentId: string;
}

function UserForm() {
  const form = useForm<User>({
    source: 'user',
    operation: 'create'
  });

  // TypeScript will provide autocomplete and type checking
  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register('firstName')} />
      <input {...form.register('email')} />
      <input {...form.register('age')} type="number" />
    </form>
  );
}
```

### 2. Handle Loading States

Always show loading indicators:

```tsx
function UserForm() {
  const form = useForm({ source: 'user', operation: 'create' });

  if (form.isLoadingInitialData) {
    return <div>Loading form schema...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Form content */}
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

### 3. Validate Before Submit

Use the built-in validation helper:

```tsx
function UserForm() {
  const form = useForm({ source: 'user', operation: 'create' });

  const handleSubmit = async () => {
    const isValid = await form.validateForm();
    if (isValid) {
      await form.submit();
    } else {
      console.log('Validation failed');
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      {/* Form fields */}
    </form>
  );
}
```

### 4. Use Default Values

Provide sensible defaults:

```tsx
function UserForm() {
  const form = useForm({
    source: 'user',
    operation: 'create',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      isActive: true,
      departmentId: 'DEFAULT_DEPT'
    }
  });

  // Form will start with these values
}
```

### 5. Handle Reference Fields Gracefully

Check for options before rendering selects:

```tsx
function UserForm() {
  const form = useForm({ source: 'user', operation: 'create' });

  const departmentField = form.getField('departmentId');
  const hasOptions = departmentField?.options && departmentField.options.length > 0;

  return (
    <form onSubmit={form.handleSubmit()}>
      <select {...form.register('departmentId')} disabled={!hasOptions}>
        <option value="">{hasOptions ? 'Select Department' : 'Loading departments...'}</option>
        {departmentField?.options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
```

## Troubleshooting

### Schema Not Loading

**Problem**: Form shows "Loading form schema..." indefinitely.

**Solutions**:
1. Check if the backend endpoint `/api/bo/{source}/field` is accessible
2. Verify the response format matches the expected schema structure
3. Check browser network tab for error responses
4. Use `onSchemaError` callback to log errors

```tsx
const form = useForm({
  source: 'user',
  operation: 'create',
  onSchemaError: (error) => {
    console.error('Schema loading failed:', error);
    // Handle error appropriately
  }
});
```

### Validation Not Working

**Problem**: Backend validation rules are not being applied.

**Solutions**:
1. Verify the validation rules in the backend schema are properly formatted
2. Check the expression tree syntax
3. Ensure field names match between form and schema
4. Test the expression evaluator with simpler expressions first

### Cross-Field Validation Issues

**Problem**: Cross-field validation (e.g., end date >= start date) not working.

**Solutions**:
1. Use `mode: 'onChange'` for real-time validation
2. Ensure both fields are registered with the form
3. Check that the expression tree correctly references both fields
4. Test the validation logic with the backend expression evaluator

### Performance Issues

**Problem**: Form is slow with large schemas or many computed fields.

**Solutions**:
1. Use `mode: 'onBlur'` instead of `'onChange'` to reduce validation frequency
2. Consider splitting large forms into multiple steps
3. Implement caching for reference data
4. Use React.memo() for form components that don't need frequent re-renders

### Type Safety Issues

**Problem**: TypeScript errors when using the form with specific data types.

**Solutions**:
1. Define proper interfaces for your form data
2. Use the generic type parameter: `useForm<MyDataType>(...)`
3. Ensure field names in your TypeScript interface match the backend schema
4. Use type assertions carefully when needed

```tsx
interface MyFormData {
  firstName: string;
  lastName: string;
  age: number;
}

const form = useForm<MyFormData>({
  source: 'user',
  operation: 'create'
});

// TypeScript will now provide proper autocomplete and type checking
```

---

For more examples and advanced usage patterns, see the [examples directory](../examples/) in the repository.