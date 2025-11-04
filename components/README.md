# Components SDK - Headless React Components

The Components SDK provides headless React hooks that integrate with both the App and API layers. It includes dynamic forms with backend validation and data tables with sorting, pagination, and React Query integration.

## Overview

The Components SDK includes:

- **Form Components** - Dynamic forms with backend-driven validation
- **Table Components** - Data tables with sorting, filtering, and pagination
- **Shared Hooks** - Common React patterns and utilities

## Architecture Integration

```tsx
// Components use App layer types for type safety
import { AdminUser } from "@kf-ai-sdk/app";

// Components use API layer for data operations  
import { api } from "@kf-ai-sdk/api";

// Components provide React hooks with React Query integration
const table = useTable<AdminUser>({
  source: "users",
  // Automatically typed as AdminUser[]
});
```

## Form Components

### useForm Hook

A React hook for building dynamic forms with backend-driven validation and automatic API integration.

```tsx
import { useForm } from "@kf-ai-sdk/components";
import { AdminUser } from "@kf-ai-sdk/app";

function CreateUserForm() {
  const form = useForm<AdminUser>({
    source: "user-validation", // Fetches validation schema
    operation: "create",       // Uses api('users').create()
    defaultValues: {
      name: "",
      email: "",
      salary: 0
    },
    onSuccess: (data) => {
      console.log("User created:", data);
    },
    onError: (error) => {
      console.error("Form error:", error);
    }
  });

  if (form.isLoadingInitialData) {
    return <div>Loading form schema...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      <input 
        {...form.register("name")} 
        placeholder="Name" 
      />
      {form.formState.errors.name && (
        <span>{form.formState.errors.name.message}</span>
      )}

      <input 
        {...form.register("email")} 
        placeholder="Email"
        type="email" 
      />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <input 
        {...form.register("salary", { valueAsNumber: true })} 
        placeholder="Salary"
        type="number" 
      />
      {form.formState.errors.salary && (
        <span>{form.formState.errors.salary.message}</span>
      )}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Creating..." : "Create User"}
      </button>

      {form.submitError && (
        <div>Error: {form.submitError.message}</div>
      )}
    </form>
  );
}
```

### Form Features

- ✅ **Backend-Driven Validation** - Automatic schema fetching from API
- ✅ **Cross-Field Validation** - Field references using $ syntax
- ✅ **Type Safety** - Integration with App layer types
- ✅ **React Query Integration** - Automatic caching and error handling
- ✅ **Loading States** - Built-in loading and error state management
- ✅ **API Integration** - Automatic submission via API layer

### Form Options

```tsx
interface UseFormOptions<T> {
  source: string;                    // Schema identifier
  operation: "create" | "update";   // API operation type
  defaultValues?: Partial<T>;       // Initial form values
  mode?: "onBlur" | "onChange" | "onSubmit"; // Validation trigger
  onSuccess?: (data: T) => void;     // Success callback
  onError?: (error: Error) => void; // Error callback
  itemId?: string;                   // For update operations
  loadEntity?: boolean;              // Auto-load existing data for updates
}
```

### Update Form Example

```tsx
function EditUserForm({ userId }: { userId: string }) {
  const form = useForm<AdminUser>({
    source: "user-validation",
    operation: "update",
    itemId: userId,
    loadEntity: true, // Automatically loads existing user data
    onSuccess: (updatedUser) => {
      console.log("User updated:", updatedUser);
      // Redirect or show success message
    }
  });

  if (form.isLoadingInitialData || form.isLoadingEntity) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit()}>
      {/* Form fields same as create form */}
      <button type="submit">Update User</button>
    </form>
  );
}
```

## Table Components

### useTable Hook

A React hook for building data tables with sorting, pagination, and React Query integration.

```tsx
import { useTable } from "@kf-ai-sdk/components";
import { AdminUser } from "@kf-ai-sdk/app";

function UsersTable() {
  const table = useTable<AdminUser>({
    source: "users",
    enableSorting: true,
    enablePagination: true,
    enableSearch: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 20
      },
      sorting: {
        key: "name",
        direction: "asc"
      }
    }
  });

  if (table.isLoading) {
    return <div>Loading users...</div>;
  }

  if (table.error) {
    return <div>Error: {table.error.message}</div>;
  }

  return (
    <div>
      {/* Search */}
      {table.enableSearch && (
        <input
          placeholder="Search users..."
          value={table.globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
      )}

      {/* Loading indicator */}
      {table.isFetching && <div>Updating...</div>}

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => table.sorting.toggle("name")}>
              Name {table.sorting.key === "name" && (
                table.sorting.direction === "asc" ? "↑" : "↓"
              )}
            </th>
            <th onClick={() => table.sorting.toggle("email")}>
              Email {table.sorting.key === "email" && (
                table.sorting.direction === "asc" ? "↑" : "↓"
              )}
            </th>
            <th onClick={() => table.sorting.toggle("salary")}>
              Salary {table.sorting.key === "salary" && (
                table.sorting.direction === "asc" ? "↑" : "↓"
              )}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((user: AdminUser) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>${user.salary}</td>
              <td>
                <button onClick={() => table.actions.edit(user.id)}>
                  Edit
                </button>
                <button onClick={() => table.actions.delete(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {table.enablePagination && (
        <div>
          <button
            onClick={() => table.pagination.goToPrevious()}
            disabled={!table.pagination.canGoToPrevious}
          >
            Previous
          </button>
          
          <span>
            Page {table.pagination.currentPage + 1} of {table.pagination.totalPages}
          </span>
          
          <button
            onClick={() => table.pagination.goToNext()}
            disabled={!table.pagination.canGoToNext}
          >
            Next
          </button>
          
          <select
            value={table.pagination.pageSize}
            onChange={(e) => table.pagination.setPageSize(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      )}
    </div>
  );
}
```

### Table Features

- ✅ **React Query Integration** - Automatic caching and background updates
- ✅ **Sorting** - Click column headers to sort
- ✅ **Pagination** - Built-in pagination controls
- ✅ **Search** - Global search across all fields
- ✅ **Type Safety** - Integration with App layer types
- ✅ **Loading States** - Built-in loading and error handling
- ✅ **Actions** - Built-in edit/delete actions

### Table Options

```tsx
interface UseTableOptions<T> {
  source: string;                    // Data source identifier
  enableSorting?: boolean;           // Enable column sorting
  enablePagination?: boolean;        // Enable pagination
  enableSearch?: boolean;            // Enable global search
  initialState?: {
    pagination?: {
      pageIndex: number;
      pageSize: number;
    };
    sorting?: {
      key: keyof T;
      direction: "asc" | "desc";
    };
  };
  onRowClick?: (row: T) => void;     // Row click handler
  onEdit?: (id: string) => void;     // Edit action handler
  onDelete?: (id: string) => void;   // Delete action handler
}
```

### Role-Based Table Example

```tsx
// Different table views based on user role
import { User, Roles, AdminUser, EmployeeUser } from "@kf-ai-sdk/app";

function RoleBasedUsersTable({ userRole }: { userRole: string }) {
  if (userRole === Roles.Admin) {
    return <AdminUsersTable />;
  } else {
    return <EmployeeUsersTable />;
  }
}

function AdminUsersTable() {
  const table = useTable<AdminUser>({
    source: "users",
    enableSorting: true,
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Salary</th> {/* Admin can see salary */}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {table.rows.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>${user.salary}</td> {/* TypeScript knows this exists */}
            <td>
              <button onClick={() => table.actions.delete(user.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmployeeUsersTable() {
  const table = useTable<EmployeeUser>({
    source: "users",
    enableSorting: true,
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          {/* No salary column - employee can't see it */}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            {/* <td>{user.salary}</td> */} {/* ❌ TypeScript Error */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Integration Examples

### Complete CRUD Interface

```tsx
import { useState } from "react";
import { useTable, useForm } from "@kf-ai-sdk/components";
import { AdminUser } from "@kf-ai-sdk/app";

function UserManagement() {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  const table = useTable<AdminUser>({
    source: "users",
    enableSorting: true,
    enablePagination: true,
    onEdit: (id) => {
      setEditingId(id);
      setMode("edit");
    },
    onDelete: async (id) => {
      if (confirm("Are you sure?")) {
        await api("users").delete(id);
        table.refetch();
      }
    }
  });

  const createForm = useForm<AdminUser>({
    source: "user-validation",
    operation: "create",
    onSuccess: () => {
      setMode("list");
      table.refetch();
    }
  });

  const editForm = useForm<AdminUser>({
    source: "user-validation", 
    operation: "update",
    itemId: editingId,
    loadEntity: true,
    onSuccess: () => {
      setMode("list");
      setEditingId(null);
      table.refetch();
    }
  });

  if (mode === "create") {
    return (
      <div>
        <h2>Create User</h2>
        <form onSubmit={createForm.handleSubmit()}>
          <input {...createForm.register("name")} placeholder="Name" />
          <input {...createForm.register("email")} placeholder="Email" />
          <input {...createForm.register("salary")} placeholder="Salary" type="number" />
          <button type="submit">Create</button>
          <button type="button" onClick={() => setMode("list")}>Cancel</button>
        </form>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div>
        <h2>Edit User</h2>
        <form onSubmit={editForm.handleSubmit()}>
          <input {...editForm.register("name")} placeholder="Name" />
          <input {...editForm.register("email")} placeholder="Email" />
          <input {...editForm.register("salary")} placeholder="Salary" type="number" />
          <button type="submit">Update</button>
          <button type="button" onClick={() => setMode("list")}>Cancel</button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h2>Users</h2>
        <button onClick={() => setMode("create")}>Create User</button>
      </div>
      
      <UsersTable />
    </div>
  );
}
```

### Search and Filter Integration

```tsx
import { useState, useEffect } from "react";
import { useTable } from "@kf-ai-sdk/components";
import { AdminProduct } from "@kf-ai-sdk/app";

function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");

  const table = useTable<AdminProduct>({
    source: "products",
    enableSorting: true,
    enablePagination: true,
    initialState: {
      sorting: { key: "name", direction: "asc" }
    }
  });

  // Update table when search/filter changes
  useEffect(() => {
    table.setGlobalFilter(searchTerm);
  }, [searchTerm]);

  return (
    <div>
      {/* Search and Filter Controls */}
      <div>
        <input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="books">Books</option>
        </select>
      </div>

      {/* Results Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => table.sorting.toggle("name")}>Name</th>
            <th onClick={() => table.sorting.toggle("price")}>Price</th>
            <th onClick={() => table.sorting.toggle("category")}>Category</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>${product.price}</td>
              <td>{product.category}</td>
              <td>{product.inStock ? "In Stock" : "Out of Stock"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <span>Total: {table.pagination.total} products</span>
      </div>
    </div>
  );
}
```

## Best Practices

### Form Best Practices

1. **Use descriptive source names** - `"user-validation"` not `"form1"`
2. **Handle loading states** - Always show feedback during schema loading
3. **Leverage backend validation** - Reduce frontend validation duplication
4. **Use cross-field validation** - Take advantage of $ field references
5. **Provide meaningful error messages** - Define clear messages in schema
6. **Use TypeScript** - Get full type safety and autocomplete

### Table Best Practices

1. **Enable appropriate features** - Don't enable pagination for small datasets
2. **Provide loading feedback** - Show loading states during data fetching
3. **Handle empty states** - Show meaningful messages when no data
4. **Use consistent sorting** - Provide default sort order
5. **Optimize for performance** - Use pagination for large datasets
6. **Handle errors gracefully** - Provide retry mechanisms

### React Query Integration

Both form and table hooks automatically integrate with React Query:

```tsx
// Forms automatically handle:
// - Schema caching via useQuery
// - Form submission via useMutation
// - Cache invalidation after success

// Tables automatically handle:
// - Data fetching via useQuery
// - Background updates and refetching
// - Loading and error states
// - Cache invalidation after mutations
```

### Performance Optimization

```tsx
// Debounced search to avoid excessive API calls
import { useDebouncedValue } from "@mantine/hooks";

function OptimizedTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchTerm, 300);

  const table = useTable({
    source: "users",
    searchQuery: debouncedSearch, // Only search after 300ms delay
    enablePagination: true
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users..."
      />
      
      {/* Table renders with debounced search */}
      <UsersTable table={table} />
    </div>
  );
}
```

## TypeScript Support

Full TypeScript integration with the App layer:

```tsx
import { AdminUser, EmployeeUser } from "@kf-ai-sdk/app";

// Form hook is fully typed
const form = useForm<AdminUser>({
  source: "user-validation",
  operation: "create"
});

// form.register() provides autocomplete for AdminUser fields
// form.formState.errors is typed with AdminUser field names

// Table hook is fully typed  
const table = useTable<EmployeeUser>({
  source: "users"
});

// table.rows is typed as EmployeeUser[]
// table.sorting.toggle() only accepts valid field names
```

This ensures that components are always type-safe and consistent with the role-based access control defined in the App layer.