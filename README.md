# @ram_28/kf-ai-sdk

A type-safe SDK for building modern web applications with React hooks for forms, tables, kanban boards, and filtering.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
  - [Setup](#setup)
  - [useAuth Hook](#useauth-hook)
  - [useAuth Return Values](#useauth-return-values)
  - [Multiple Auth Providers](#multiple-auth-providers)
  - [Protected Routes](#protected-routes)
- [Hooks](#hooks)
  - [useTable](#usetable)
  - [useForm](#useform)
  - [useKanban](#usekanban)
  - [useFilter](#usefilter)
- [API Client](#api-client)
- [Type System](#type-system)
- [Utilities](#utilities)
  - [Formatting](#formatting)
  - [Class Names](#class-names)
- [Documentation](#documentation)
- [Requirements](#requirements)
- [License](#license)

## Installation

```bash
npm install @ram_28/kf-ai-sdk
```

**Peer Dependencies:**

```bash
npm install react @tanstack/react-query
```

## Features

- **Authentication** - Cookie-based auth with AuthProvider and useAuth hook
- **useForm** - Dynamic schema-driven forms with backend validation
- **useTable** - Data tables with sorting, pagination, and React Query integration
- **useKanban** - Kanban board state management with drag-drop support
- **useFilter** - Advanced filtering with logical operators and payload builders
- **API Client** - Type-safe CRUD operations with structured filtering and sorting
- **Type System** - 10 semantic field types (StringField, NumberField, CurrencyField, etc.)
- **Utilities** - Formatting helpers for currency, dates, numbers, and more

## Quick Start

```tsx
// Authentication
import { AuthProvider, useAuth } from "@ram_28/kf-ai-sdk/auth";
import type { UseAuthReturnType, UserDetailsType } from "@ram_28/kf-ai-sdk/auth/types";

// Hooks
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";
import { useFilter } from "@ram_28/kf-ai-sdk/filter";

// Types
import type { UseFormOptionsType, UseFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import type { UseTableOptionsType, UseTableReturnType } from "@ram_28/kf-ai-sdk/table/types";
import type { UseKanbanOptionsType, UseKanbanReturnType } from "@ram_28/kf-ai-sdk/kanban/types";
import type { UseFilterOptionsType, UseFilterReturnType } from "@ram_28/kf-ai-sdk/filter/types";

// API
import { api } from "@ram_28/kf-ai-sdk/api";
import type { ListResponseType, FilterType } from "@ram_28/kf-ai-sdk/api/types";

// Utilities
import { formatCurrency, formatDate } from "@ram_28/kf-ai-sdk/utils";

// Base Field Types
import type { StringFieldType, CurrencyFieldType } from "@ram_28/kf-ai-sdk/types";
```

## Authentication

The SDK provides a complete authentication solution with cookie-based session management.

### Setup

Wrap your app with `AuthProvider` inside a `QueryClientProvider`. No configuration required - it works out of the box:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@ram_28/kf-ai-sdk/auth";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MyApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### useAuth Hook

Access authentication state and operations in any component:

```tsx
import { useAuth } from "@ram_28/kf-ai-sdk/auth";

function UserMenu() {
  const { user, isAuthenticated, isLoading, logout, hasRole } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <span>Welcome, {user._name}</span>
      <span>Role: {user.Role}</span>

      {hasRole("Admin") && <a href="/admin">Admin Dashboard</a>}

      <button onClick={() => logout({ redirectUrl: "/" })}>Logout</button>
    </div>
  );
}
```

### useAuth Return Values

```tsx
const {
  // User state
  user, // UserDetails | null
  staticBaseUrl, // string | null
  buildId, // string | null
  status, // 'loading' | 'authenticated' | 'unauthenticated'
  isAuthenticated, // boolean
  isLoading, // boolean

  // Operations
  login, // (provider?, options?) => void
  logout, // (options?) => Promise<void>
  refreshSession, // () => Promise<SessionResponse | null>
  hasRole, // (role: string) => boolean
  hasAnyRole, // (roles: string[]) => boolean

  // Error handling
  error, // Error | null
  clearError, // () => void
} = useAuth();
```

### Multiple Auth Providers

```tsx
import { useAuth } from "@ram_28/kf-ai-sdk/auth";

function LoginPage() {
  const { login } = useAuth();

  return (
    <div>
      <button onClick={() => login("google")}>Continue with Google</button>
      <button onClick={() => login("microsoft")}>
        Continue with Microsoft
      </button>
    </div>
  );
}
```

### Protected Routes

```tsx
import { useAuth } from "@ram_28/kf-ai-sdk/auth";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requiredRoles }) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

// Usage
<ProtectedRoute requiredRoles={["Admin", "Manager"]}>
  <AdminDashboard />
</ProtectedRoute>;
```

## Hooks

### useTable

Data table hook with sorting, pagination, and React Query integration.

```tsx
import { useTable } from "@ram_28/kf-ai-sdk/table";

function ProductTable() {
  const table = useTable({
    source: "products",
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "price", enableSorting: true },
    ],
    initialState: {
      pagination: { pageNo: 1, pageSize: 25 },
    },
  });

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => table.sort.toggle("name")}>Name</th>
          <th onClick={() => table.sort.toggle("price")}>Price</th>
        </tr>
      </thead>
      <tbody>
        {table.rows.map((product) => (
          <tr key={product._id}>
            <td>{product.name}</td>
            <td>${product.price}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={2}>
            <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>
              Previous
            </button>
            <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
            <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>
              Next
            </button>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
```

### useForm

Schema-driven form hook with backend validation support.

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";

function ProductForm() {
  const form = useForm({
    source: "products",
    operation: "create",
    onSuccess: (data) => {
      console.log("Created:", data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register("name")} placeholder="Product Name" />
      {form.errors.name && <span>{form.errors.name.message}</span>}

      <input {...form.register("price")} type="number" placeholder="Price" />
      {form.errors.price && <span>{form.errors.price.message}</span>}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

### useKanban

Kanban board state management with drag-drop support.

```tsx
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";
import { Kanban, KanbanColumn, KanbanCard } from "@ram_28/kf-ai-sdk/kanban/ui";

function TaskBoard() {
  const kanban = useKanban({
    source: "tasks",
    groupByField: "status",
    columns: [
      { id: "todo", title: "To Do" },
      { id: "in-progress", title: "In Progress" },
      { id: "done", title: "Done" },
    ],
  });

  return (
    <Kanban>
      {kanban.columns.map((column) => (
        <KanbanColumn key={column.id} column={column}>
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card}>
              {card.title}
            </KanbanCard>
          ))}
        </KanbanColumn>
      ))}
    </Kanban>
  );
}
```

### useFilter

Advanced filtering with logical operators.

```tsx
import { useFilter } from "@ram_28/kf-ai-sdk/filter";

function ProductFilter() {
  const filter = useFilter({
    fields: {
      name: { type: "string" },
      price: { type: "number" },
      category: {
        type: "select",
        options: ["electronics", "clothing", "books"],
      },
    },
  });

  const handleApply = () => {
    const payload = buildFilterPayload(filter.conditions);
    // Use payload with API
  };

  return (
    <div>
      <button onClick={() => filter.addCondition("name", "contains", "")}>
        Add Name Filter
      </button>
      <button onClick={() => filter.addCondition("price", "gte", 0)}>
        Add Price Filter
      </button>
      <button onClick={handleApply}>Apply Filters</button>
    </div>
  );
}
```

## API Client

Type-safe API client for CRUD operations.

```tsx
import { api, setApiBaseUrl } from "@ram_28/kf-ai-sdk/api";

// Configure base URL
setApiBaseUrl("https://api.example.com");

// CRUD Operations
async function productOperations() {
  // Get single record
  const product = await api("products").get("PROD_123");

  // Create record
  const created = await api("products").create({
    name: "New Product",
    price: 99.99,
    category: "electronics",
  });

  // Update record
  const updated = await api("products").update("PROD_123", {
    price: 89.99,
  });

  // Delete record
  await api("products").delete("PROD_123");

  // List with filtering and sorting
  const products = await api("products").list({
    Filter: {
      Operator: "AND",
      Condition: [
        { Operator: "EQ", LHSField: "category", RHSValue: "electronics" },
        { Operator: "GTE", LHSField: "price", RHSValue: 50 },
      ],
    },
    Sort: [{ Field: "price", Order: "DESC" }],
    Page: 1,
    PageSize: 25,
  });

  // Count records
  const count = await api("products").count({
    Filter: {
      Operator: "AND",
      Condition: [{ Operator: "EQ", LHSField: "inStock", RHSValue: true }],
    },
  });
}
```

## Type System

The SDK provides semantic field types for type-safe data modeling:

```tsx
import type {
  StringFieldType,
  TextAreaFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  CurrencyFieldType,
  SelectFieldType,
} from "@ram_28/kf-ai-sdk/types";

// Define your data types
interface Product {
  _id: StringFieldType;
  name: StringFieldType;
  description: TextAreaFieldType;
  price: CurrencyFieldType;
  quantity: NumberFieldType;
  inStock: BooleanFieldType;
  category: SelectFieldType<"electronics" | "clothing" | "books">;
  createdAt: DateTimeFieldType;
}
```

## Utilities

### Formatting

```tsx
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
} from "@ram_28/kf-ai-sdk/utils";

formatCurrency(99.99); // "$99.99"
formatDate(new Date()); // "Jan 11, 2024"
formatDateTime(new Date()); // "Jan 11, 2024, 10:30 AM"
formatNumber(1234.56, 2); // "1,234.56"
formatPercentage(0.156); // "15.6%"
```

### Class Names

```tsx
import { cn } from "@ram_28/kf-ai-sdk/utils";

// Merge Tailwind classes with conflict resolution
cn("px-4 py-2", "px-6"); // "py-2 px-6"
cn("text-red-500", condition && "text-blue-500");
```

## Documentation

Detailed documentation for each feature:

- [useForm Documentation](./docs/useForm.md)
- [useTable Documentation](./docs/useTable.md)
- [useKanban Documentation](./docs/useKanban.md)
- [useFilter Documentation](./docs/useFilter.md)
- [Quick Reference](./docs/QUICK_REFERENCE.md)

## Requirements

- Node.js >= 18.0.0
- React >= 16.8.0
- @tanstack/react-query >= 5.0.0

## License

MIT
