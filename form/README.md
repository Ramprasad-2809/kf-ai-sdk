# Form SDK

A React hook for building dynamic forms with backend-driven validation, seamless API integration, and automatic schema loading. Built on top of React Hook Form with React Query for optimal data fetching and caching.

## Core Concepts

### Backend-Driven Validation

Forms automatically fetch validation schemas from your API endpoints, eliminating the need for manual validation rule definition. Support for cross-field validation, custom error messages, and complex business logic.

### Seamless API Integration

Built-in integration with the API client for automatic form submission, data loading, and error handling. No manual fetch calls or state management required.

### Schema Flexibility

Support for both FormJson and FormSchema formats, allowing flexible validation rule definition with field references, custom operators, and dynamic validation logic.

## Quick Start

```tsx
import { useForm } from "@kf-ai-sdk/headless-filter";

function UserForm() {
  const form = useForm<User>({
    source: "users", // Automatically fetches schema and handles React Query
    operation: "create", // Handles submission via api('users').create()
    defaultValues: {
      name: "",
      email: "",
      age: "",
    },
    onSuccess: (data) => {
      console.log("Form submitted:", data);
    },
    onError: (error) => {
      console.error("Form error:", error);
    },
  });

  if (form.isLoadingInitialData) {
    return <div>Loading form schema...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register("name")} placeholder="Name" />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}

      <input {...form.register("email")} placeholder="Email" />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <input
        {...form.register("age", { valueAsNumber: true })}
        type="number"
        placeholder="Age"
      />
      {form.formState.errors.age && (
        <span>{form.formState.errors.age.message}</span>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Submitting..." : "Submit"}
      </button>

      {form.submitError && <div>Error: {form.submitError.message}</div>}
    </form>
  );
}
```

## API Integration

The Form SDK automatically integrates with React Query internally when you provide `source` and `operation`:

```tsx
// useForm automatically handles:
// - Schema loading via api('forms').get(source) with React Query caching
// - Form submission via api(resourceName)[operation](data)
// - Loading states and error handling
// - Cache invalidation after successful operations

const form = useForm({
  source: "users", // Form automatically calls api('forms').get('users')
  operation: "create", // Form automatically calls api('users').create(data)
  defaultValues: { name: "", email: "" },
  onSuccess: (data) => console.log("Success:", data),
  onError: (error) => console.error("Error:", error),
});

// Internal behavior (handled automatically):
// - Schema loading: api('forms').get('user-validation') with caching
// - Form submission: api('users').create(formData) for create operations
// - For updates: api('users').update(id, formData)
// - Error handling: form.submitError, form.loadError
// - Loading states: form.isLoadingInitialData, form.isSubmitting
// - Cache management: Automatic invalidation of related queries
```

### Advanced Configuration

```tsx
// For update operations
const form = useForm<User>({
  source: "users",
  operation: "update",
  itemId: "user_123", // Required for update operations
  defaultValues: existingUserData,
});

// Custom resource mapping
const form = useForm<User>({
  source: "users",
  operation: "create",
  resourceName: "team-members", // Override default resource name
});
```

## Features

- ✅ **Backend-Driven Validation** - Automatic schema fetching and validation rule application
- ✅ **Cross-Field Validation** - Field references using $ syntax for complex validation
- ✅ **API Integration** - Built-in API client integration for seamless data operations
- ✅ **Loading States** - Automatic handling of loading, success, and error states
- ✅ **Type Safety** - Full TypeScript support with intelligent type inference
- ✅ **Flexible Schema** - Support for FormJson and FormSchema formats
- ✅ **Custom Resolvers** - Override default behavior with custom validation logic
- ✅ **React Hook Form** - Built on the proven React Hook Form foundation

## Advanced Example

```tsx
import { useForm } from "@kf-ai-sdk/headless-filter";
import { api } from "@kf-ai-sdk/headless-filter";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Advanced Form - Demonstrates built-in SDK validation features
 *
 * This form uses the default source behavior with automatic validation
 * fetched from the backend. The SDK automatically handles:
 * - Cross-field validation (email matching, password matching)
 * - Field length validation
 * - Number range validation
 * - Date comparison validation
 *
 * No custom resolvers needed - the SDK handles everything!
 */
export default function AdvancedForm() {
  const navigate = useNavigate();

  // Using default source behavior - the SDK will:
  // 1. Fetch form schema from api('forms').get('advanced-validation')
  // 2. Apply all validation rules automatically
  // 3. Handle cross-field validation with $ syntax
  // 4. Show appropriate error messages
  // 5. Submit data using api('users').create(data)
  const form = useForm({
    source: "advanced-validation",
    operation: "create",
    defaultValues: {
      email: "",
      confirmEmail: "",
      password: "",
      confirmPassword: "",
      age: "",
      startDate: "",
      endDate: "",
    },
    mode: "onBlur", // Validate on blur for better UX with cross-field validation
    onSuccess: (data) => {
      alert(`Form submitted successfully!\n\n${JSON.stringify(data, null, 2)}`);
      navigate("/users");
    },
    onError: (error) => {
      alert(`Error submitting form: ${error.message}`);
    },
  });

  // Show loading state while schema is being fetched
  if (form.isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading form schema...</div>
      </div>
    );
  }

  // Show error if schema fetch failed
  if (form.loadError) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Form
            </CardTitle>
            <CardDescription>
              Failed to fetch form validation schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {form.loadError.message}
            </p>
            <p className="text-sm text-muted-foreground">
              This form requires a backend endpoint accessible via{" "}
              <code className="bg-muted px-2 py-1 rounded">
                api('forms').get('advanced-validation')
              </code>{" "}
              that returns a FormSchema or FormJson with validation rules.
            </p>
            <div className="mt-4 space-x-2">
              <Button variant="outline" onClick={() => navigate("/users")}>
                Back to Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Form Validation</h1>
        <p className="text-muted-foreground">
          Demonstrates automatic validation from backend schema - no custom
          resolvers needed!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form with Built-in Validation</CardTitle>
          <CardDescription>
            The SDK automatically fetches validation rules from the backend and
            applies them. This demonstrates the default source behavior with
            zero custom code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit()} className="space-y-6">
            {/* Email fields - SDK automatically handles cross-field validation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="user@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmEmail">Confirm Email *</Label>
                <Input
                  id="confirmEmail"
                  type="email"
                  {...form.register("confirmEmail")}
                  placeholder="Confirm your email"
                />
                {form.formState.errors.confirmEmail && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmEmail.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password fields - SDK automatically handles cross-field validation */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password * (min 8 chars)</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="Min 8 characters"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  placeholder="Confirm your password"
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {/* Age - backend validates >= 18 */}
            <div className="space-y-2">
              <Label htmlFor="age">Age * (must be 18+)</Label>
              <Input
                id="age"
                type="number"
                {...form.register("age", { valueAsNumber: true })}
                placeholder="18+"
              />
              {form.formState.errors.age && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.age.message}
                </p>
              )}
            </div>

            {/* Date range - backend validates end > start */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input id="endDate" type="date" {...form.register("endDate")} />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Validation Features Info */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Validation Features (Backend Defined):
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>✓ Cross-field validation (email & password matching)</p>
                <p>✓ Text field length validation (password min 8 chars)</p>
                <p>✓ Number comparison (age ≥ 18)</p>
                <p>✓ Date comparison (end date &gt; start date)</p>
                <p>✓ Custom error messages from backend</p>
                <p>✓ Field references using $ syntax</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  All validation rules are fetched from
                  api('forms').get('advanced-validation')
                </p>
              </CardContent>
            </Card>

            {/* Submit Error */}
            {form.submitError && (
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">
                  {form.submitError.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/users")}
                disabled={form.isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Developer Notes */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-900 dark:text-blue-100">
            💡 Developer Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>React Query Integration:</strong> This form uses React Query
            for optimal data management:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>
              <strong>Schema Caching:</strong> Fetches schema from{" "}
              <code>api('forms').get('advanced-validation')</code> with
              automatic caching
            </li>
            <li>
              <strong>Error Handling:</strong> Built-in retry logic and error
              boundaries
            </li>
            <li>
              <strong>Loading States:</strong> Automatic loading indicators
              during fetch/submit
            </li>
            <li>
              <strong>Cache Invalidation:</strong> Automatically updates user
              list after submission
            </li>
            <li>
              <strong>Optimistic Updates:</strong> Can be extended with
              optimistic UI updates
            </li>
            <li>
              <strong>Validation:</strong> Cross-field validation with $ field
              references
            </li>
          </ul>
          <p className="pt-2">
            <strong>Performance Benefits:</strong> React Query provides
            automatic background refetching, request deduplication, and
            intelligent caching for better user experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Hook API Reference

### useForm(options)

The main hook for creating forms with backend-driven validation.

#### Parameters

```tsx
interface useFormOptions {
  source: string; // Form schema identifier
  operation: "create" | "update"; // Operation type for API calls
  defaultValues?: Record<string, any>; // Initial form values
  mode?: "onBlur" | "onChange" | "onSubmit"; // Validation trigger mode
  onSuccess?: (data: any) => void; // Success callback
  onError?: (error: Error) => void; // Error callback
  resolver?: Resolver; // Custom validation resolver (optional)
  itemId?: string; // For update operations
}
```

#### Return Value

```tsx
interface DataFormInstance {
  // Form methods (from React Hook Form)
  register: (name: string, options?: RegisterOptions) => object;
  handleSubmit: (
    onValid?: SubmitHandler,
    onInvalid?: SubmitErrorHandler
  ) => (e?: React.BaseSyntheticEvent) => Promise<void>;
  setValue: (name: string, value: any, options?: SetValueConfig) => void;
  getValues: (name?: string | string[]) => any;
  reset: (values?: any, options?: KeepStateOptions) => void;

  // Form state
  formState: {
    errors: FieldErrors;
    isValid: boolean;
    isDirty: boolean;
    isSubmitted: boolean;
    // ... other React Hook Form state
  };

  // SDK-specific state
  isLoadingInitialData: boolean; // Schema loading state
  loadError: Error | null; // Schema loading error
  isSubmitting: boolean; // Form submission state
  submitError: Error | null; // Form submission error

  // Data operations
  refetchSchema: () => Promise<void>; // Reload form schema
  clearErrors: () => void; // Clear all errors
}
```

## Schema Formats

The Form SDK supports two schema formats:

### FormJson Format

```json
{
  "fields": {
    "email": {
      "type": "string",
      "required": true,
      "validation": {
        "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        "message": "Please enter a valid email address"
      }
    },
    "confirmEmail": {
      "type": "string",
      "required": true,
      "validation": {
        "equals": "$email",
        "message": "Emails must match"
      }
    },
    "age": {
      "type": "number",
      "required": true,
      "validation": {
        "min": 18,
        "message": "Must be at least 18 years old"
      }
    }
  }
}
```

### FormSchema Format

```json
{
  "type": "object",
  "required": ["email", "confirmEmail", "age"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "errorMessage": "Please enter a valid email address"
    },
    "confirmEmail": {
      "type": "string",
      "const": { "$data": "1/email" },
      "errorMessage": "Emails must match"
    },
    "age": {
      "type": "number",
      "minimum": 18,
      "errorMessage": "Must be at least 18 years old"
    }
  }
}
```

## Cross-Field Validation

Use the `$` syntax to reference other fields in validation rules:

```json
{
  "confirmPassword": {
    "type": "string",
    "validation": {
      "equals": "$password",
      "message": "Passwords must match"
    }
  },
  "endDate": {
    "type": "string",
    "validation": {
      "after": "$startDate",
      "message": "End date must be after start date"
    }
  }
}
```

## Custom Resolvers

For advanced use cases, provide custom validation logic:

```tsx
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const customSchema = yup.object({
  email: yup.string().required().email(),
  age: yup.number().required().min(18),
});

const form = useForm({
  source: "user-validation",
  operation: "create",
  resolver: yupResolver(customSchema), // Override default behavior
  defaultValues: {
    email: "",
    age: "",
  },
});
```

## API Integration Details

The Form SDK automatically handles all React Query integration internally. Here's what happens under the hood:

### Automatic Schema Loading

```tsx
// When you provide a source, useForm automatically:
// 1. Creates a React Query for schema loading
// 2. Handles caching, retries, and error states
// 3. Applies validation rules once schema loads

const form = useForm({
  source: "user-validation",
  // Internally creates: useQuery(['forms', 'user-validation'], () => api('forms').get('user-validation'))
});

// Access loading and error states through the form object
form.isLoadingInitialData; // Schema loading state
form.loadError; // Schema loading errors
```

### Automatic Form Submission

```tsx
// When you provide an operation, useForm automatically:
// 1. Creates appropriate mutations based on operation type
// 2. Handles cache invalidation after successful submissions
// 3. Provides loading states and error handling

const form = useForm({
  source: "user-validation",
  operation: "create", // Internally creates: useMutation(api('users').create)
  onSuccess: (data) => {
    // Called after successful submission
    // Cache invalidation happens automatically
  },
  onError: (error) => {
    // Called on submission errors
  },
});

// Access submission states through the form object
form.isSubmitting; // Submission loading state
form.submitError; // Submission errors
```

### Operation Types and Resource Mapping

```tsx
// Create operation
const createForm = useForm({
  source: "user-validation",
  operation: "create", // Maps to: api('users').create(data)
});

// Update operation
const updateForm = useForm({
  source: "user-validation",
  operation: "update",
  itemId: "user_123", // Maps to: api('users').update('user_123', data)
});

// Custom resource name
const teamForm = useForm({
  source: "user-validation",
  operation: "create",
  resourceName: "team-members", // Maps to: api('team-members').create(data)
});
```

### Advanced Form Loading

```tsx
// For update forms, useForm can automatically load existing data
const editForm = useForm({
  source: "user-validation",
  operation: "update",
  itemId: userId,
  loadEntity: true, // Automatically loads existing user data
  // Internally creates: useQuery(['users', userId], () => api('users').get(userId))
});

// Access entity loading state
editForm.isLoadingEntity; // Entity data loading state
editForm.entityError; // Entity loading errors
```

## Best Practices

1. **Use descriptive source names** - Makes API endpoints clear and maintainable
2. **Leverage backend validation** - Reduce frontend validation code duplication
3. **Handle loading states** - Always show feedback during schema loading
4. **Use cross-field validation** - Take advantage of $ field references
5. **Provide meaningful error messages** - Define clear error messages in your schema
6. **Use TypeScript** - Get full type safety and autocomplete
7. **Test with different validation modes** - Choose the right UX for your use case

## Integration with Filter SDK

The Form SDK works seamlessly with the Filter SDK for advanced search forms:

```tsx
import { useForm } from "@kf-ai-sdk/headless-filter";
import { useFilter } from "@kf-ai-sdk/headless-filter";

function SearchForm() {
  const filter = useFilter();

  const form = useForm({
    source: "search-validation", // Automatically loads search form schema
    operation: "search", // Custom operation for search forms
    onSubmit: (data) => {
      // Build filter from form data
      filter.clear();
      Object.entries(data).forEach(([field, value]) => {
        if (value) {
          filter.addCondition(null, {
            field,
            operator: "CONTAINS",
            value: String(value),
          });
        }
      });
    },
  });

  // Use filter with Table SDK for automatic search results
  const table = useTable({
    source: "users",
    filter: filter.json, // Apply form-generated filter to table
    enableFiltering: true,
  });

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={form.handleSubmit()}>
        <input {...form.register("name")} placeholder="Search by name..." />
        <input {...form.register("email")} placeholder="Search by email..." />
        <select {...form.register("department")}>
          <option value="">All Departments</option>
          <option value="engineering">Engineering</option>
          <option value="marketing">Marketing</option>
        </select>
        <button type="submit">Search</button>
        <button type="button" onClick={() => filter.clear()}>
          Clear
        </button>
      </form>

      {/* Search Results via Table SDK */}
      <div>
        {table.isLoading && <div>Searching...</div>}
        <table>
          <tbody>
            {table.rows.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {table.rows.length === 0 && !table.isLoading && (
          <div>No users found matching your criteria</div>
        )}
      </div>
    </div>
  );
}
```

### Advanced Search with Debouncing

```tsx
function AdvancedSearchForm() {
  const filter = useFilter();
  const [searchTerm, setSearchTerm] = useState("");

  // Update filter when search term changes
  useEffect(() => {
    const timer = setTimeout(() => {
      filter.clear();
      if (searchTerm) {
        filter.addCondition(null, {
          field: "name",
          operator: "CONTAINS",
          value: searchTerm,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use table with dynamic filter
  const table = useTable({
    source: "users",
    filter: filter.json,
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Type to search..."
      />
      {table.isFetching && <div>Searching...</div>}
      <div>
        {table.rows.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    </div>
  );
}
```
