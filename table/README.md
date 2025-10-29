# Table SDK

A React hook for building powerful data tables with sorting, filtering, pagination, and seamless React Query integration. Built to work seamlessly with the Filter, Form, and API SDKs for complete data management workflows with optimal caching and performance.

## Core Concepts

### Data-Driven Tables

Tables automatically fetch data from your API endpoints using React Query for optimal caching, loading states, and error handling. No manual data fetching or state management required.

### Column System

Flexible column definitions with built-in helpers for common data types (dates, enums, booleans). Support for custom transformations and type-safe column configuration.

### Integrated Features

Built-in sorting, filtering, pagination with React Query-powered loading states, error handling, and automatic caching. Seamlessly integrates with the Filter SDK for advanced filtering capabilities.

## Quick Start

```tsx
import {
  useTable,
  createDateColumn,
  createEnumColumn,
} from "@kf-ai-sdk/headless-filter";

function UsersTable() {
  const table = useTable<User>({
    source: "users", // Automatically uses React Query internally
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "email", enableSorting: true },
      createEnumColumn<User>("status", {
        mapping: {
          active: "Active",
          inactive: "Inactive",
          pending: "Pending",
        },
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

  if (table.isLoading) return <div>Loading users...</div>;
  if (table.error) return <div>Error: {table.error.message}</div>;

  return (
    <div>
      {/* Search */}
      <input
        placeholder="Search users..."
        value={table.globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
      />

      {/* Table */}
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

## API Integration

The Table SDK automatically integrates with React Query internally when you provide a `source`:

```tsx
// useTable automatically handles:
// - React Query integration with intelligent caching
// - Automatic API calls via api(source).list()
// - Loading states and error handling
// - Background updates and refetching
// - Query key management with filters, sorting, pagination

const table = useTable<User>({
  source: "users", // Table automatically calls api('users').list()
  columns: [...],
  enableSorting: true,
  enableFiltering: true,
  enablePagination: true,
});

// Internal behavior (handled automatically):
// - Generates query keys: ['users', 'list', { page, sort, filter, search }]
// - Calls: api('users').list({ pageNo, pageSize, sort, filter, q })
// - Manages: keepPreviousData, staleTime, error retry logic
// - Provides: table.isLoading, table.error, table.rows, etc.
```

## Features

- ✅ **React Query Integration** - Automatic data fetching with caching, background updates, and error handling
- ✅ **Sorting** - Per-column sorting with visual indicators and query key management
- ✅ **Filtering** - Global search and Filter SDK integration with automatic cache invalidation
- ✅ **Pagination** - Built-in pagination with page size controls and `keepPreviousData` support
- ✅ **Loading States** - Automatic loading indicators, error boundaries, and retry mechanisms
- ✅ **Column Helpers** - Pre-built column types for common data formats
- ✅ **Type Safety** - Full TypeScript support with intelligent types
- ✅ **Performance** - Optimized rendering, request deduplication, and intelligent caching
- ✅ **Optimistic Updates** - Support for optimistic mutations and cache updates
- ✅ **Background Sync** - Automatic background refetching and stale-while-revalidate patterns

## Hook API Reference

### useTable<T>(options)

The main hook for creating data tables.

#### Parameters

```tsx
interface useTableOptions<T> {
  source: string; // Resource name for API calls
  columns: ColumnDefinition<T>[]; // Column configuration
  enableSorting?: boolean; // Enable sorting (default: true)
  enableFiltering?: boolean; // Enable global filtering (default: true)
  enablePagination?: boolean; // Enable pagination (default: true)
  initialState?: {
    pagination?: {
      pageIndex: number;
      pageSize: number;
    };
    sorting?: {
      key: keyof T;
      direction: "asc" | "desc";
    };
    globalFilter?: string;
  };
  onError?: (error: Error) => void; // Error callback
  debounceMs?: number; // Filter debounce delay (default: 300)
}
```

#### Return Value

```tsx
interface DataTableInstance<T> {
  // Data
  rows: T[]; // Current page data

  // State (unified access)
  isLoading: boolean;
  error: Error | null;

  // Filtering
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  clearFilter: () => void;

  // Pagination (unified interface)
  pagination: {
    // State
    pageIndex: number;
    pageSize: number;
    currentPage: number; // Computed: pageIndex
    totalPages: number;
    totalItems: number;

    // Navigation
    canGoToPrevious: boolean;
    canGoToNext: boolean;
    goToPrevious: () => void;
    goToNext: () => void;
    goToPage: (page: number) => void;
    setPageSize: (size: number) => void;
  };

  // Sorting (unified interface)
  sorting: {
    // State
    key: keyof T | null;
    direction: "asc" | "desc";

    // Actions
    toggle: (field: keyof T) => void;
    set: (field: keyof T, direction: "asc" | "desc") => void;
    clear: () => void;
  };

  // Data operations
  refetch: () => Promise<void>; // Reload data
  refresh: () => Promise<void>; // Alias for refetch
}
```

## Column System

### Basic Column Definition

```tsx
interface ColumnDefinition<T> {
  fieldId: keyof T; // Field name in data
  enableSorting?: boolean; // Enable sorting for this column
  transform?: (value: any, row: T) => any; // Transform value for display
}
```

### Column Helpers

#### createDateColumn<T>(fieldId, options)

Creates a column for date fields with formatting options.

```tsx
createDateColumn<User>("createdAt", {
  format: "short" | "medium" | "long" | "full",
  enableSorting: true,
  locale: string, // Locale for formatting (default: 'en-US')
});

// Usage examples:
createDateColumn<User>("createdAt", { format: "short" }); // 1/1/2024
createDateColumn<User>("updatedAt", { format: "medium" }); // Jan 1, 2024
createDateColumn<User>("lastLogin", { format: "long" }); // January 1, 2024
```

#### createEnumColumn<T>(fieldId, options)

Creates a column for enum/status fields with value mapping.

```tsx
createEnumColumn<User>("status", {
  mapping: {
    active: "Active",
    inactive: "Inactive",
    pending: "Pending",
  },
  enableSorting: true,
  fallback: string, // Fallback text for unmapped values
});

// Advanced mapping with styling:
createEnumColumn<User>("priority", {
  mapping: {
    high: { label: "High Priority", className: "text-red-600" },
    medium: { label: "Medium", className: "text-yellow-600" },
    low: { label: "Low", className: "text-green-600" },
  },
  enableSorting: true,
});
```

#### createBooleanColumn<T>(fieldId, options)

Creates a column for boolean fields with custom labels.

```tsx
createBooleanColumn<User>("isVerified", {
  trueLabel: "Verified",
  falseLabel: "Unverified",
  enableSorting: true,
  showIcon: boolean, // Show checkmark/x icons
});

// With custom styling:
createBooleanColumn<User>("isActive", {
  trueLabel: "Active",
  falseLabel: "Inactive",
  trueClassName: "text-green-600",
  falseClassName: "text-gray-400",
  enableSorting: true,
});
```

### Custom Column Transformations

```tsx
// Custom transform function
{
  fieldId: 'role',
  enableSorting: true,
  transform: (value: User['role']): string => {
    const roleMap: Record<User['role'], string> = {
      admin: 'Administrator',
      user: 'Regular User',
      moderator: 'Moderator',
    };
    return roleMap[value] || value;
  },
}

// Complex transformation with multiple fields
{
  fieldId: 'name',
  enableSorting: true,
  transform: (value: string, row: User): string => {
    return `${value} ${row.isOnline ? '🟢' : '🔴'}`;
  },
}
```

## Sorting

The Table SDK provides comprehensive sorting capabilities:

```tsx
// Toggle sorting for a column
table.sorting.toggle("name");

// Set specific sort direction
table.sorting.set("createdAt", "desc");

// Clear all sorting
table.sorting.clear();

// Check current sort state
if (table.sorting.key === "name") {
  const direction = table.sorting.direction; // 'asc' | 'desc'
}
```

### Sort Indicators

```tsx
const getSortIcon = (fieldId: string): JSX.Element => {
  if (table.sorting.key !== fieldId) {
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  }
  return table.sorting.direction === "asc" ? (
    <ArrowUp className="ml-2 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4" />
  );
};
```

## Filtering

### Global Search

```tsx
// Set global filter
table.setGlobalFilter("search term");

// Clear filter
table.clearFilter();

// Access current filter
const currentFilter = table.globalFilter;
```

### Integration with Filter SDK

```tsx
import { useFilter } from '@kf-ai-sdk/headless-filter';

function AdvancedTableWithFilters() {
  const filter = useFilter();

  const table = useTable<User>({
    source: 'users',
    columns: [...],
    // Filter SDK integration happens automatically
    // The table will include filter.json in API calls
  });

  return (
    <div>
      {/* Advanced filter UI using Filter SDK */}
      <FilterRoot>
        <FilterGroup>
          {/* Filter UI components */}
        </FilterGroup>
      </FilterRoot>

      {/* Table automatically uses the filter */}
      <table>...</table>
    </div>
  );
}
```

## Pagination

The Table SDK provides complete pagination functionality:

```tsx
// Navigation
table.pagination.goToNext();
table.pagination.goToPrevious();
table.pagination.goToPage(5);

// Page size
table.pagination.setPageSize(50);

// State information
const { currentPage, totalPages, totalItems, canGoToNext, canGoToPrevious } =
  table.pagination;
```

## Error Handling

```tsx
function TableWithErrorHandling() {
  const table = useTable<User>({
    source: 'users',
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "email", enableSorting: true },
    ],
    onError: (error) => {
      console.error('Table error:', error);
      // Custom error handling - could trigger toast notifications
    }
  });

  if (table.error) {
    return (
      <div className="error-container">
        <h3>Error loading data</h3>
        <p>{table.error.message}</p>
        <div className="error-actions">
          <button onClick={() => table.refetch()}>
            Retry
          </button>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // ... rest of table
}
```

## Loading States

```tsx
function TableWithLoadingStates() {
  const table = useTable<User>({
    source: 'users',
    columns: [
      { fieldId: "name", enableSorting: true },
      { fieldId: "email", enableSorting: true },
    ],
  });

  // Initial loading state
  if (table.isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Background loading indicator for subsequent requests */}
      {table.isFetching && (
        <div className="loading-indicator">
          <span>Updating...</span>
        </div>
      )}
      
      {/* Table content */}
      <table>
        <tbody>
          {table.rows.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Complete Example

```tsx
import {
  useTable,
  createDateColumn,
  createEnumColumn,
  createBooleanColumn,
} from "@kf-ai-sdk/headless-filter";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import type { User } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Delete mutation for row actions
  const deleteUserMutation = useMutation({
    mutationFn: api('users').delete,
    onSuccess: (_, deletedUserId) => {
      // Remove from cache and invalidate list
      queryClient.removeQueries({ queryKey: ['users', deletedUserId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  // Initialize Table SDK - handles React Query internally
  const table = useTable<User>({
    source: "users", // Automatically manages data fetching via React Query
    columns: [
      {
        fieldId: "name",
        enableSorting: true,
      },
      {
        fieldId: "email",
        enableSorting: true,
      },
      // Boolean column examples
      createBooleanColumn<User>("isVerified", {
        trueLabel: "Verified",
        falseLabel: "Unverified",
        enableSorting: true,
      }),
      createBooleanColumn<User>("isOnline", {
        trueLabel: "Online",
        falseLabel: "Offline",
        enableSorting: true,
      }),
      createEnumColumn<User>("status", {
        mapping: {
          active: "Active",
          inactive: "Inactive",
          pending: "Pending",
        },
        enableSorting: true,
      }),
      {
        fieldId: "role",
        enableSorting: true,
        // Custom transform with explicit type
        transform: (value: User["role"]): string => {
          const roleMap: Record<User["role"], string> = {
            admin: "Admin",
            user: "User",
            moderator: "Moderator",
          };
          return roleMap[value] || value;
        },
      },
      createDateColumn<User>("createdAt", {
        format: "short",
        enableSorting: true,
      }),
      createDateColumn<User>("lastLogin", {
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

  const handleEdit = (user: User): void => {
    navigate(`/users/${user.id}/edit`);
  };

  const handleDelete = (user: User): void => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleViewDetails = (user: User): void => {
    console.log("View details:", user);
    alert(
      `User Details:\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${
        user.role
      }\nStatus: ${user.status}\nVerified: ${
        user.isVerified ? "Yes" : "No"
      }\nOnline: ${user.isOnline ? "Yes" : "No"}`
    );
  };

  const getSortIcon = (fieldId: string): JSX.Element => {
    if (table.sorting.key !== fieldId) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return table.sorting.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const renderStatusBadge = (status: User["status"]): JSX.Element => {
    const styles = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (table.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading users...</span>
      </div>
    );
  }

  if (table.error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <h3 className="font-semibold text-destructive">Error loading users</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {table.error.message}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.refetch()}
          className="mt-4"
          disabled={table.isFetching}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {table.isFetching ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage your user accounts with sorting, filtering, and pagination
          </p>
        </div>
        <Button onClick={() => navigate("/users/create")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Search users..."
            value={table.globalFilter}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="h-9 w-[250px]"
          />
          {table.globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.setGlobalFilter("")}
            >
              Clear
            </Button>
          )}
          {table.isFetching && (
            <div className="text-sm text-muted-foreground">
              Updating...
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.refetch()}
          className="h-9"
          disabled={table.isFetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${table.isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("name")}
                  className="hover:bg-transparent"
                >
                  Name
                  {getSortIcon("name")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("email")}
                  className="hover:bg-transparent"
                >
                  Email
                  {getSortIcon("email")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("isVerified")}
                  className="hover:bg-transparent"
                >
                  Verified
                  {getSortIcon("isVerified")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("isOnline")}
                  className="hover:bg-transparent"
                >
                  Online
                  {getSortIcon("isOnline")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("status")}
                  className="hover:bg-transparent"
                >
                  Status
                  {getSortIcon("status")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("role")}
                  className="hover:bg-transparent"
                >
                  Role
                  {getSortIcon("role")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("createdAt")}
                  className="hover:bg-transparent"
                >
                  Created
                  {getSortIcon("createdAt")}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => table.sorting.toggle("lastLogin")}
                  className="hover:bg-transparent"
                >
                  Last Login
                  {getSortIcon("lastLogin")}
                </Button>
              </TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.rows.length > 0 ? (
              table.rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isVerified
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {user.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isOnline
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 mr-1 rounded-full ${
                          user.isOnline ? "bg-green-500" : "bg-gray-500"
                        }`}
                      ></span>
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </TableCell>
                  <TableCell>{renderStatusBadge(user.status)}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(user)}
                        >
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          Edit user
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          className="text-destructive"
                        >
                          Delete user
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No users found.
                  {table.globalFilter && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => table.setGlobalFilter("")}
                      className="ml-2"
                    >
                      Clear search
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.pagination.currentPage * table.pagination.pageSize + 1}{" "}
          to{" "}
          {Math.min(
            (table.pagination.currentPage + 1) * table.pagination.pageSize,
            table.pagination.totalItems
          )}{" "}
          of {table.pagination.totalItems} users
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              value={table.pagination.pageSize}
              onChange={(e) =>
                table.pagination.setPageSize(Number(e.target.value))
              }
              className="h-9 w-[70px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {table.pagination.currentPage + 1} of{" "}
              {table.pagination.totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.pagination.goToPrevious()}
                disabled={!table.pagination.canGoToPrevious}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.pagination.goToNext()}
                disabled={!table.pagination.canGoToNext}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Integration with Filter SDK

For advanced filtering capabilities, integrate with the Filter SDK:

```tsx
import { useFilter } from '@kf-ai-sdk/headless-filter';
import { FilterRoot, FilterGroup, FilterCondition } from '@kf-ai-sdk/headless-filter/ui';

function TableWithAdvancedFilters() {
  const filter = useFilter();

  const table = useTable<User>({
    source: 'users',
    columns: [...],
    // The table automatically includes filter.json in API calls
  });

  return (
    <div className="space-y-6">
      {/* Advanced Filter Panel */}
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-4">Advanced Filters</h3>
        <FilterRoot>
          <FilterGroup>
            {({ conditions, addCondition }) => (
              <div className="space-y-2">
                {conditions.map(condition => (
                  <FilterCondition key={condition.id} conditionId={condition.id}>
                    {/* Filter UI components */}
                  </FilterCondition>
                ))}
                <button onClick={addCondition}>Add Filter</button>
              </div>
            )}
          </FilterGroup>
        </FilterRoot>
      </div>

      {/* Table automatically uses the advanced filters */}
      <div>
        {/* Table implementation */}
      </div>
    </div>
  );
}
```

## Integration with Form SDK

For inline editing capabilities:

```tsx
import { useForm } from '@kf-ai-sdk/headless-filter';

function TableWithInlineEditing() {
  const table = useTable<User>({ source: 'users', columns: [...] });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const editForm = useForm({
    source: 'user-validation',
    operation: 'update',
    onSuccess: () => {
      setEditingUserId(null);
      table.refetch(); // Refresh table data
    }
  });

  return (
    <div>
      {/* Table with inline editing */}
      <table>
        <tbody>
          {table.rows.map((user) => (
            <tr key={user.id}>
              {editingUserId === user.id ? (
                <td colSpan={3}>
                  <form onSubmit={editForm.handleSubmit()}>
                    <input {...editForm.register('name')} defaultValue={user.name} />
                    <input {...editForm.register('email')} defaultValue={user.email} />
                    <button type="submit">Save</button>
                    <button onClick={() => setEditingUserId(null)}>Cancel</button>
                  </form>
                </td>
              ) : (
                <>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <button onClick={() => setEditingUserId(user.id)}>
                      Edit
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Performance Optimization

### Debounced Filtering

```tsx
const table = useTable<User>({
  source: 'users',
  columns: [...],
  debounceMs: 500, // Debounce filter changes for 500ms
});
```

### Memoized Columns

```tsx
import { useMemo } from "react";

function OptimizedTable() {
  const columns = useMemo(
    () => [
      { fieldId: "name", enableSorting: true },
      { fieldId: "email", enableSorting: true },
      createDateColumn<User>("createdAt", { format: "short" }),
    ],
    []
  );

  const table = useTable<User>({
    source: "users",
    columns, // Memoized columns prevent unnecessary re-renders
  });

  // ... rest of component
}
```

## TypeScript Support

Full TypeScript integration with intelligent type inference:

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  role: "admin" | "user" | "moderator";
  isVerified: boolean;
  isOnline: boolean;
  createdAt: string;
  lastLogin: string;
}

// Type-safe table configuration
const table = useTable<User>({
  source: "users",
  columns: [
    { fieldId: "name", enableSorting: true }, // ✅ 'name' is valid
    { fieldId: "invalid", enableSorting: true }, // ❌ TypeScript error
    createEnumColumn<User>("status", {
      // ✅ Type-safe enum mapping
      mapping: {
        active: "Active",
        inactive: "Inactive",
        pending: "Pending",
      },
    }),
  ],
});

// Type-safe access to table data
table.rows.forEach((user: User) => {
  console.log(user.name); // ✅ Fully typed
});
```

## Best Practices

1. **Use column helpers** - Leverage `createDateColumn`, `createEnumColumn`, etc. for common data types
2. **Memoize columns** - Use `useMemo` for column definitions to prevent re-renders
3. **Handle loading states** - Always provide loading and error UI feedback
4. **Optimize API calls** - Use appropriate debounce delays for filtering
5. **Type your data** - Use TypeScript interfaces for full type safety
6. **Integrate with other SDKs** - Combine with Filter and Form SDKs for complete workflows
7. **Test pagination** - Ensure pagination works correctly with your data sizes
8. **Accessible UI** - Use proper ARIA labels and keyboard navigation
9. **Performance monitoring** - Monitor API call frequency and table render performance
10. **Error boundaries** - Implement error boundaries for better error handling
