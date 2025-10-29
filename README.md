# KF AI SDK

A comprehensive solution for building complex filter queries, dynamic forms, and API interactions. Includes headless React hooks and a chainable API client for modern web applications.

## Components

### 🔍 Filter SDK

A headless React hook for building complex filter queries with nested AND/OR logic. Integrates seamlessly with React Query for optimal caching and performance.

### 📝 Form SDK

A React hook for building dynamic forms with backend-driven validation, React Query-powered schema loading, and automatic error handling with optimistic updates.

### 📊 Table SDK

A React hook for building powerful data tables with sorting, filtering, pagination, and React Query integration for automatic caching, background updates, and loading states.

### 🚀 API Client

A chainable API client designed for React Query integration, providing 5 core CRUD operations with seamless filter integration, caching, and error handling.

## Quick Start

### Filter Building

```tsx
import { useFilter, useTable } from "@kf-ai-sdk/headless-filter";

function MyComponent() {
  const filter = useFilter();

  // Add simple conditions
  filter.addCondition(null, {
    field: "name",
    operator: "CONTAINS",
    value: "john",
  });

  // Use filter with Table SDK for automatic data fetching and caching
  const table = useTable({
    source: "users",
    filter: filter.json, // Table automatically handles React Query with filters
    enableFiltering: true,
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  return (
    <div>
      {/* Filter controls */}
      <div>
        <button onClick={() => filter.clear()}>Clear Filters</button>
        <span>Active conditions: {filter.conditionCount}</span>
      </div>

      {/* Results */}
      {table.isLoading && <div>Loading...</div>}
      {table.rows.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Form Building

```tsx
import { useForm } from "@kf-ai-sdk/headless-filter";

function UserForm() {
  const form = useForm<User>({
    source: "users", // Automatically fetches schema and handles React Query
    operation: "create", // Automatically handles submission via api('users').create()
    defaultValues: { name: "", email: "" },
    onSuccess: (data) => {
      console.log("Form submitted:", data);
    },
    onError: (error) => {
      console.error("Form error:", error);
    },
  });

  if (form.isLoadingInitialData) return <div>Loading form...</div>;

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register("name")} placeholder="Name" />
      <input {...form.register("email")} placeholder="Email" />
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Submitting..." : "Submit"}
      </button>
      {form.submitError && <div>Error: {form.submitError.message}</div>}
    </form>
  );
}
```

### Table Building

```tsx
import {
  useTable,
  createDateColumn,
  createEnumColumn,
} from "@kf-ai-sdk/headless-filter";

function UsersTable() {
  const table = useTable<User>({
    source: "users", // Automatically handles React Query integration
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "email", enableSorting: true },
      createEnumColumn<User>("status", {
        mapping: { active: "Active", inactive: "Inactive" },
        enableSorting: true,
      }),
      createDateColumn<User>("createdAt", {
        format: "short",
        enableSorting: true,
      }),
    ],
    enableSorting: true,
    enableFiltering: true,
    enablePagination: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20,
      },
      sorting: {
        key: "createdAt",
        direction: "desc",
      },
    },
  });

  if (table.isLoading) return <div>Loading...</div>;
  if (table.error) return <div>Error: {table.error.message}</div>;

  return (
    <div>
      <input
        placeholder="Search..."
        value={table.globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
      />
      {table.isFetching && <div>Updating...</div>}
      <table>
        <thead>
          <tr>
            <th onClick={() => table.sorting.toggle("name")}>
              Name {table.sorting.key === "name" ? "↕️" : ""}
            </th>
            <th onClick={() => table.sorting.toggle("email")}>
              Email {table.sorting.key === "email" ? "↕️" : ""}
            </th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.status}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button
          onClick={() => table.pagination.goToPrevious()}
          disabled={!table.pagination.canGoToPrevious}
        >
          Previous
        </button>
        <span>
          Page {table.pagination.currentPage + 1} of{" "}
          {table.pagination.totalPages}
        </span>
        <button
          onClick={() => table.pagination.goToNext()}
          disabled={!table.pagination.canGoToNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### API Operations

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function UserOperations() {
  const queryClient = useQueryClient();

  // Query for fetching a user
  const userQuery = useQuery({
    queryKey: ["users", "user_1"],
    queryFn: () => api("users").get("user_1"),
  });

  // Mutations for CRUD operations
  const createUserMutation = useMutation({
    mutationFn: api("users").create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api("users").update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(["users", id], data);
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: api("users").delete,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ["users", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
    },
  });

  // Filtered list query
  const filteredUsersQuery = useQuery({
    queryKey: ["users", "filtered", filterJson],
    queryFn: () =>
      api("users").list({
        filter: filterJson,
        sort: [{ field: "name", direction: "asc" }],
        pageNo: 1,
        pageSize: 25,
      }),
    enabled: !!filterJson,
  });

  return (
    <div>
      <button
        onClick={() =>
          createUserMutation.mutate({
            name: "John",
            email: "john@example.com",
          })
        }
      >
        Create User
      </button>
      <button
        onClick={() =>
          updateUserMutation.mutate({
            id: "user_1",
            data: { status: "active" },
          })
        }
      >
        Update User
      </button>
      <button onClick={() => deleteUserMutation.mutate("user_1")}>
        Delete User
      </button>
    </div>
  );
}
```

## Documentation

### Filter SDK

- **[Filter Overview](filter/README.md)** - Core concepts and quick start guide
- **[Hook API Reference](filter/hook.md)** - Complete useFilter API and advanced patterns
- **[UI Components](filter/components.md)** - Headless UI components and implementation examples

### Form SDK

- **[Form Overview](form/README.md)** - Backend-driven validation and API integration

### Table SDK

- **[Table Overview](table/README.md)** - Data tables with sorting, filtering, and pagination

### API Client

- **[API Documentation](api/README.md)** - Complete API client methods and integration examples

## Features

### Filter SDK

- ✅ **Nested Groups** - Complex AND/OR logic with unlimited nesting
- ✅ **Field Comparison** - Compare fields against other fields or parameters
- ✅ **Flexible Operators** - Text, numeric, date, and null comparison operators
- ✅ **Headless UI** - Unstyled components for complete design control

### Form SDK

- ✅ **Backend-Driven Validation** - Automatic schema fetching and rule application
- ✅ **Cross-Field Validation** - Field references using $ syntax for complex validation
- ✅ **API Integration** - Built-in API client integration for seamless data operations
- ✅ **Loading States** - Automatic handling of loading, success, and error states

### Table SDK

- ✅ **API Integration** - Automatic data fetching using the API client
- ✅ **Sorting & Filtering** - Built-in sorting and global search capabilities
- ✅ **Pagination** - Complete pagination with page size controls
- ✅ **Column Helpers** - Pre-built column types for dates, enums, booleans
- ✅ **Loading & Error States** - Automatic state management and user feedback

### API Client

- ✅ **CRUD Operations** - get, create, update, delete, list with unified interface
- ✅ **Filter Integration** - Seamless integration with Filter SDK
- ✅ **Pagination & Sorting** - Built-in support for data table operations
- ✅ **Error Handling** - Consistent error handling across all operations

### All SDKs

- ✅ **Type Safe** - Complete TypeScript support with intelligent types
- ✅ **React Hooks** - Modern React patterns with state management
- ✅ **JSON Generation** - Automatic conversion to backend-ready formats

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
  value: true,
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

## License

MIT
