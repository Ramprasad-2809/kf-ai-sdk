# KF AI SDK

A type-safe, AI-driven SDK for building modern web applications with role-based access control, dynamic forms, and data tables. Built on a three-layer architecture for optimal AI code generation and developer experience.

## Architecture Overview

The KF AI SDK is built on three integrated layers:

### 🎯 App Layer (`app/`)

**Type-Safe Contracts with Role-Based Access Control**

- AI-readable type definitions and schemas
- Role-based field access enforcement
- Single source of truth for data models and permissions
- Compile-time validation of AI-generated code

### 🔗 API Layer (`api/`)

**Simple CRUD Operations**

- Chainable API client: `api('users').list()`, `api('users').get()`, etc.
- 5 core operations: get, create, update, delete, list
- Basic HTTP client with error handling
- Clean separation from business logic

### 🧩 Components Layer (`components/`)

**Headless React Components**

- Dynamic forms with backend-driven validation
- Data tables with sorting, filtering, and pagination
- React Query integration for optimal caching
- Type-safe integration with App and API layers

## Quick Start

### Three-Layer Integration Example

```tsx
// 1. AI reads App Layer for type-safe code generation
import { User, Roles, AdminUser } from "@kf-ai-sdk/app";

// 2. Components use API Layer for data operations
import { api } from "@kf-ai-sdk/api";

// 3. UI components integrate both layers
import { useTable, useForm } from "@kf-ai-sdk/components";

function AdminUserManagement() {
  // Type-safe user client with role-based access
  const user = new User(Roles.Admin);

  // Table with automatic type inference
  const table = useTable<AdminUser>({
    source: "users",
    enableSorting: true,
    enablePagination: true,
  });

  // Form with backend-driven validation
  const form = useForm<AdminUser>({
    source: "user-validation",
    operation: "create",
    onSuccess: () => table.refetch(),
  });

  return (
    <div>
      {/* Create Form */}
      <form onSubmit={form.handleSubmit()}>
        <input {...form.register("name")} placeholder="Name" />
        <input {...form.register("email")} placeholder="Email" />
        <input {...form.register("salary")} placeholder="Salary" />{" "}
        {/* Admin can see salary */}
        <button type="submit">Create User</button>
      </form>

      {/* Users Table */}
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
          {table.rows.map((user: AdminUser) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>${user.salary}</td>{" "}
              {/* TypeScript knows this exists for Admin */}
              <td>
                <button onClick={() => user.delete(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Role-Based Access Control

```tsx
// Employee gets limited access to the same data
import { User, Roles, EmployeeUser } from "@kf-ai-sdk/app";

function EmployeeUserList() {
  const user = new User(Roles.Employee);

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
          {/* <th>Salary</th> */} {/* Employee cannot see salary */}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((user: EmployeeUser) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            {/* <td>{user.salary}</td> */}{" "}
            {/* ❌ TypeScript Error: Property doesn't exist */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Simple API Operations

```tsx
import { api } from "@kf-ai-sdk/api";

// Basic CRUD operations
async function userOperations() {
  // Get single user
  const user = await api("users").get("user_123");

  // Create new user
  const newUser = await api("users").create({
    name: "John Doe",
    email: "john@example.com",
  });

  // Update user
  const updatedUser = await api("users").update("user_123", {
    status: "active",
  });

  // Delete user
  await api("users").delete("user_123");

  // List users with pagination
  const usersList = await api("users").list({
    pageNo: 1,
    pageSize: 20,
    sort: [{ field: "name", direction: "asc" }],
  });
}
```

## Documentation

### Layer Documentation

- **[App SDK](app/README.md)** - Type-safe contracts, roles, and AI code generation
- **[API Client](api/README.md)** - Simple CRUD operations and HTTP client
- **[Components](components/README.md)** - React hooks for forms and tables

### Migration Guide

- **[Migration Guide](MIGRATION.md)** - Upgrading from the previous structure

## Features

### App Layer (`sdk/app`)

- ✅ **Role-Based Access Control** - Compile-time enforcement of field visibility
- ✅ **AI Code Generation** - Single source of truth for AI-readable contracts
- ✅ **Type Safety** - TypeScript validation of all generated code
- ✅ **Semantic Types** - Field types that convey meaning (IdField, StringField, etc.)
- ✅ **Single File Per Source** - All logic for a data model in one place

### API Layer (`sdk/api`)

- ✅ **Simple CRUD Operations** - get, create, update, delete, list
- ✅ **Chainable Interface** - Clean `api('source').method()` syntax
- ✅ **Error Handling** - Consistent error handling across operations
- ✅ **TypeScript Support** - Full type safety for API operations

### Components Layer (`sdk/components`)

- ✅ **Backend-Driven Forms** - Automatic validation schema loading
- ✅ **Data Tables** - Sorting, pagination, and search functionality
- ✅ **React Query Integration** - Optimal caching and background updates
- ✅ **Type-Safe Integration** - Uses App layer types for compile-time safety
- ✅ **Headless UI** - Unstyled components for complete design control

## Key Benefits

### For AI Code Generation

- **Single Source of Truth**: App layer provides all type definitions in one place
- **Role Awareness**: AI generates code that respects user permissions
- **Type Safety**: Any TypeScript error indicates incorrect AI generation
- **Self-Documenting**: Type definitions serve as API documentation

### For Developers

- **Three-Layer Architecture**: Clear separation of concerns
- **Role-Based Security**: Compile-time enforcement of data access
- **Modern React**: Hooks, React Query, and TypeScript throughout
- **Extensible**: Easy to add new data sources and roles

### For Applications

- **Performance**: React Query caching and background updates
- **Reliability**: Type-safe operations prevent runtime errors
- **Scalability**: Consistent patterns across all data operations
- **Maintainability**: Single file per data model, clear structure

## Example: AI-Generated Admin Page

When AI generates an admin page for "Order Management", it reads the App layer and produces:

```tsx
import { Order, Roles, AdminOrder } from "@kf-ai-sdk/app";
import { useTable, useForm } from "@kf-ai-sdk/components";

// AI generates type-safe code based on role
function AdminOrderManagement() {
  const order = new Order(Roles.Admin); // Type-safe role

  const table = useTable<AdminOrder>({
    source: "orders",
    enableSorting: true,
  });

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Total Amount</th> {/* Admin can see financial data */}
          <th>Profit Margin</th> {/* Admin can see profit */}
          <th>Internal Notes</th> {/* Admin can see internal notes */}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((order: AdminOrder) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.customerId}</td>
            <td>${order.totalAmount}</td>{" "}
            {/* ✅ TypeScript knows this exists */}
            <td>{order.profitMargin}%</td> {/* ✅ TypeScript knows this exists */}
            <td>{order.internalNotes}</td>{" "}
            {/* ✅ TypeScript knows this exists */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// If AI tries to generate employee code that accesses admin fields:
function EmployeeOrderList() {
  const order = new Order(Roles.Employee);
  const data = await order.get("123");

  return <div>{data.totalAmount}</div>; // ❌ TypeScript Error!
  // Property 'totalAmount' does not exist on type 'EmployeeOrder'
}
```

**The AI sees the TypeScript error and automatically regenerates correct code.**

## License

MIT
