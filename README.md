# @ram_28/kf-ai-sdk

A type-safe SDK for building modern web applications with React hooks for forms, tables, and filtering.

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
  - [useForm](#useform)
  - [useTable](#usetable)
  - [useFilter](#usefilter)
- [BDO (Business Data Object)](#bdo-business-data-object)
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
- **useForm** - BDO-integrated forms with automatic validation and API calls
- **useTable** - Data tables with sorting, pagination, and React Query integration
- **useFilter** - Advanced filtering with logical operators and payload builders
- **BDO Module** - Type-safe, role-based data access layer with expression validation
- **API Client** - Type-safe CRUD operations with structured filtering and sorting
- **Type System** - 12 semantic field types (StringField, NumberField, TextField, etc.)
- **Utilities** - Formatting helpers for currency, dates, numbers, and more

## Quick Start

```tsx
// Authentication
import { AuthProvider, useAuth } from "@ram_28/kf-ai-sdk/auth";
import type { UseAuthReturnType, UserDetailsType } from "@ram_28/kf-ai-sdk/auth/types";

// Hooks
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { useTable } from "@ram_28/kf-ai-sdk/table";
import { useFilter } from "@ram_28/kf-ai-sdk/filter";

// Types
import type { UseFormOptionsType, UseFormReturnType } from "@ram_28/kf-ai-sdk/form/types";
import type { UseTableOptionsType, UseTableReturnType } from "@ram_28/kf-ai-sdk/table/types";
import type { UseFilterOptionsType, UseFilterReturnType } from "@ram_28/kf-ai-sdk/filter/types";

// BDO
import { BaseBdo, StringField, NumberField } from "@ram_28/kf-ai-sdk/bdo";

// API
import { api } from "@ram_28/kf-ai-sdk/api";
import type { ListResponseType, FilterType } from "@ram_28/kf-ai-sdk/api/types";

// Utilities
import { formatCurrency, formatDate } from "@ram_28/kf-ai-sdk/utils";

// Base Field Types
import type { StringFieldType, NumberFieldType } from "@ram_28/kf-ai-sdk/types";
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

### useForm

BDO-integrated form hook with automatic validation and API calls.

```tsx
import { useForm } from "@ram_28/kf-ai-sdk/form";
import { AdminProduct } from "./bdo/admin/Product";

function ProductForm() {
  const product = new AdminProduct();

  const { register, handleSubmit, errors, isSubmitting } = useForm({
    bdo: product,
    defaultValues: { Title: "", Price: 0 },
  });

  return (
    <form onSubmit={handleSubmit(
      (result) => console.log("Created:", result),
      (error) => console.error("Error:", error)
    )}>
      <input {...register("Title")} placeholder="Product Title" />
      {errors.Title && <span>{errors.Title.message}</span>}

      <input {...register("Price")} type="number" placeholder="Price" />
      {errors.Price && <span>{errors.Price.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Product"}
      </button>
    </form>
  );
}
```

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

### useFilter

Advanced filtering with logical operators.

```tsx
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
import { BuyerProduct } from "./bdo/buyer/Product";

function ProductFilter() {
  const product = new BuyerProduct();
  const filter = useFilter();

  return (
    <div>
      <button onClick={() => filter.addCondition({
        Operator: ConditionOperator.Contains,
        LHSField: product.Title.id,
        RHSValue: "",
        RHSType: RHSType.Constant,
      })}>
        Add Name Filter
      </button>
      <button onClick={() => filter.addCondition({
        Operator: ConditionOperator.GTE,
        LHSField: product.Price.id,
        RHSValue: 0,
        RHSType: RHSType.Constant,
      })}>
        Add Price Filter
      </button>
      <button onClick={() => console.log(filter.payload)}>Apply Filters</button>
    </div>
  );
}
```

## BDO (Business Data Object)

Type-safe, role-based data access layer:

```tsx
import { BaseBdo, StringField, NumberField } from "@ram_28/kf-ai-sdk/bdo";

// Define your BDO class
class AdminProduct extends BaseBdo<ProductType, ProductEditableType, ProductReadonlyType> {
  readonly meta = { _id: "BDO_Product", name: "Product" } as const;

  readonly Title = new StringField({ _id: "Title", Name: "Product Title", Type: "String", Constraint: { Required: true } });
  readonly Price = new NumberField({ _id: "Price", Name: "Price", Type: "Number" });

  // Expose only the methods this role can use
  public async get(id: string) { return super.get(id); }
  public async list(options?: any) { return super.list(options); }
  public async create(data: Partial<ProductEditableType>) { return super.create(data); }
  public async update(id: string, data: Partial<ProductEditableType>) { return super.update(id, data); }
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
      Operator: "And",
      Condition: [
        { Operator: "EQ", LHSField: "category", RHSValue: "electronics" },
        { Operator: "GTE", LHSField: "price", RHSValue: 50 },
      ],
    },
    Sort: [{ "price": "DESC" }],
    Page: 1,
    PageSize: 25,
  });

  // Count records
  const count = await api("products").count({
    Filter: {
      Operator: "And",
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
  TextFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  SelectFieldType,
  ReferenceFieldType,
} from "@ram_28/kf-ai-sdk/types";

// Define your data types
interface Product {
  _id: StringFieldType;
  name: StringFieldType;
  description: TextFieldType;
  price: NumberFieldType;
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
} from "@ram_28/kf-ai-sdk/utils";

formatCurrency(99.99); // "$99.99"
formatDate(new Date()); // "Jan 11, 2024"
formatDateTime(new Date()); // "Jan 11, 2024, 10:30 AM"
formatNumber(1234.56, 2); // "1,234.56"
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

- [useBDOTable Documentation](./docs/useBDOTable.md)
- [useActivityTable Documentation](./docs/useActivityTable.md)
- [useFilter Documentation](./docs/useFilter.md)
- [useForm Documentation](./docs/useForm.md)
- [useAuth Documentation](./docs/useAuth.md)
- [API Documentation](./docs/api.md)

## Requirements

- Node.js >= 18.0.0
- React >= 16.8.0
- @tanstack/react-query >= 5.0.0

## License

MIT
