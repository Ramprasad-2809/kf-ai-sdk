# @ram_28/kf-ai-sdk

A type-safe SDK for building modern web applications with React hooks for forms, tables, kanban boards, and filtering.

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
- **Type System** - 11 semantic field types (IdField, StringField, CurrencyField, etc.)
- **Utilities** - Formatting helpers for currency, dates, numbers, and more

## Quick Start

```tsx
import {
  // Authentication
  AuthProvider,
  useAuth,
  configureAuth,

  // Hooks
  useForm,
  useTable,
  useKanban,
  useFilter,

  // API
  api,
  setApiBaseUrl,

  // Utilities
  formatCurrency,
  formatDate
} from '@ram_28/kf-ai-sdk';

// Configure API base URL
setApiBaseUrl('https://api.example.com');
```

## Authentication

The SDK provides a complete authentication solution with cookie-based session management.

### Setup

Wrap your app with `AuthProvider` inside a `QueryClientProvider`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, setApiBaseUrl, configureAuth } from '@ram_28/kf-ai-sdk';

// Configure API
setApiBaseUrl('https://api.example.com');

// Optional: customize auth settings
configureAuth({
  defaultProvider: 'google',
  autoRedirect: true,
  providers: {
    google: {
      loginPath: '/api/auth/google/login',
      logoutPath: '/api/auth/logout',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        loadingComponent={<div>Loading...</div>}
        onAuthChange={(status, user) => console.log('Auth:', status, user)}
      >
        <MyApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### useAuth Hook

Access authentication state and operations in any component:

```tsx
import { useAuth } from '@ram_28/kf-ai-sdk';

function UserMenu() {
  const { user, isAuthenticated, isLoading, logout, hasRole } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <span>Welcome, {user._name}</span>
      <span>Role: {user.Role}</span>

      {hasRole('Admin') && <a href="/admin">Admin Dashboard</a>}

      <button onClick={() => logout({ redirectUrl: '/' })}>
        Logout
      </button>
    </div>
  );
}
```

### useAuth Return Values

```tsx
const {
  // User state
  user,              // UserDetails | null
  staticBaseUrl,     // string | null
  buildId,           // string | null
  status,            // 'loading' | 'authenticated' | 'unauthenticated'
  isAuthenticated,   // boolean
  isLoading,         // boolean

  // Operations
  login,             // (provider?, options?) => void
  logout,            // (options?) => Promise<void>
  refreshSession,    // () => Promise<SessionResponse | null>
  hasRole,           // (role: string) => boolean
  hasAnyRole,        // (roles: string[]) => boolean

  // Error handling
  error,             // Error | null
  clearError,        // () => void
} = useAuth();
```

### Multiple Auth Providers

```tsx
import { useAuth } from '@ram_28/kf-ai-sdk';

function LoginPage() {
  const { login } = useAuth();

  return (
    <div>
      <button onClick={() => login('google')}>
        Continue with Google
      </button>
      <button onClick={() => login('microsoft')}>
        Continue with Microsoft
      </button>
    </div>
  );
}
```

### Protected Routes

```tsx
import { useAuth } from '@ram_28/kf-ai-sdk';
import { Navigate } from 'react-router-dom';

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
<ProtectedRoute requiredRoles={['Admin', 'Manager']}>
  <AdminDashboard />
</ProtectedRoute>
```

## Hooks

### useTable

Data table hook with sorting, pagination, and React Query integration.

```tsx
import { useTable } from '@ram_28/kf-ai-sdk';

function ProductTable() {
  const table = useTable({
    source: 'products',
    enableSorting: true,
    enablePagination: true,
    pageSize: 25,
  });

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => table.toggleSort('name')}>Name</th>
          <th onClick={() => table.toggleSort('price')}>Price</th>
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
        <button onClick={table.previousPage} disabled={!table.hasPreviousPage}>
          Previous
        </button>
        <span>Page {table.currentPage}</span>
        <button onClick={table.nextPage} disabled={!table.hasNextPage}>
          Next
        </button>
      </tfoot>
    </table>
  );
}
```

### useForm

Schema-driven form hook with backend validation support.

```tsx
import { useForm } from '@ram_28/kf-ai-sdk';

function ProductForm() {
  const form = useForm({
    source: 'products',
    operation: 'create',
    onSuccess: (data) => {
      console.log('Created:', data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit()}>
      <input {...form.register('name')} placeholder="Product Name" />
      {form.errors.name && <span>{form.errors.name.message}</span>}

      <input {...form.register('price')} type="number" placeholder="Price" />
      {form.errors.price && <span>{form.errors.price.message}</span>}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

### useKanban

Kanban board state management with drag-drop support.

```tsx
import { useKanban, Kanban, KanbanColumn, KanbanCard } from '@ram_28/kf-ai-sdk';

function TaskBoard() {
  const kanban = useKanban({
    source: 'tasks',
    groupByField: 'status',
    columns: [
      { id: 'todo', title: 'To Do' },
      { id: 'in-progress', title: 'In Progress' },
      { id: 'done', title: 'Done' },
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
import { useFilter, buildFilterPayload } from '@ram_28/kf-ai-sdk';

function ProductFilter() {
  const filter = useFilter({
    fields: {
      name: { type: 'string' },
      price: { type: 'number' },
      category: { type: 'select', options: ['electronics', 'clothing', 'books'] },
    },
  });

  const handleApply = () => {
    const payload = buildFilterPayload(filter.conditions);
    // Use payload with API
  };

  return (
    <div>
      <button onClick={() => filter.addCondition('name', 'contains', '')}>
        Add Name Filter
      </button>
      <button onClick={() => filter.addCondition('price', 'gte', 0)}>
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
import { api, setApiBaseUrl } from '@ram_28/kf-ai-sdk';

// Configure base URL
setApiBaseUrl('https://api.example.com');

// CRUD Operations
async function productOperations() {
  // Get single record
  const product = await api('products').get('PROD_123');

  // Create record
  const created = await api('products').create({
    name: 'New Product',
    price: 99.99,
    category: 'electronics',
  });

  // Update record
  const updated = await api('products').update('PROD_123', {
    price: 89.99,
  });

  // Delete record
  await api('products').delete('PROD_123');

  // List with filtering and sorting
  const products = await api('products').list({
    Filter: {
      Operator: 'AND',
      Condition: [
        { Operator: 'EQ', LHSField: 'category', RHSValue: 'electronics' },
        { Operator: 'GTE', LHSField: 'price', RHSValue: 50 },
      ],
    },
    Sort: [
      { Field: 'price', Order: 'DESC' },
    ],
    Page: 1,
    PageSize: 25,
  });

  // Count records
  const count = await api('products').count({
    Filter: {
      Operator: 'AND',
      Condition: [
        { Operator: 'EQ', LHSField: 'inStock', RHSValue: true },
      ],
    },
  });
}
```

## Type System

The SDK provides semantic field types for type-safe data modeling:

```tsx
import type {
  IdField,
  StringField,
  TextAreaField,
  NumberField,
  BooleanField,
  DateField,
  DateTimeField,
  CurrencyField,
  PercentageField,
  SelectField,
} from '@ram_28/kf-ai-sdk';

// Define your data types
interface Product {
  _id: IdField;
  name: StringField<string>;
  description: TextAreaField;
  price: CurrencyField;
  quantity: NumberField<0>;
  inStock: BooleanField;
  category: SelectField<'electronics' | 'clothing' | 'books'>;
  createdAt: DateTimeField;
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
  formatPercentage
} from '@ram_28/kf-ai-sdk';

formatCurrency(99.99);           // "$99.99"
formatDate(new Date());          // "Jan 11, 2024"
formatDateTime(new Date());      // "Jan 11, 2024, 10:30 AM"
formatNumber(1234.56, 2);        // "1,234.56"
formatPercentage(0.156);         // "15.6%"
```

### Class Names

```tsx
import { cn } from '@ram_28/kf-ai-sdk';

// Merge Tailwind classes with conflict resolution
cn('px-4 py-2', 'px-6');  // "py-2 px-6"
cn('text-red-500', condition && 'text-blue-500');
```

## Documentation

Detailed documentation for each feature:

- [Authentication Documentation](./docs/useAuth.md)
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
