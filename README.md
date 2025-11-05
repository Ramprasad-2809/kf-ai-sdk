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

**Runtime CRUD API Client**

- Business Object API client: `api('user').list()`, `api('leave').get()`, etc.
- 5 core operations: get, create, update, delete, list
- Full Runtime API compatibility with structured filtering and sorting
- Automatic datetime encoding/decoding for API formats
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
import { Order, Roles, AdminOrder } from "@kf-ai-sdk/app";

// 2. Components use API Layer for data operations
import { api } from "@kf-ai-sdk/api";

// 3. UI components integrate both layers
import { useTable, useForm } from "@kf-ai-sdk/components";

function AdminOrderManagement() {
  // Type-safe order client with role-based access
  const order = new Order(Roles.Admin);

  // Table with automatic type inference
  const table = useTable<AdminOrder>({
    source: "orders",
    enableSorting: true,
    enablePagination: true,
  });

  // Form with backend-driven validation
  const form = useForm<AdminOrder>({
    source: "order-validation",
    operation: "create",
    onSuccess: () => table.refetch(),
  });

  return (
    <div>
      {/* Create Form */}
      <form onSubmit={form.handleSubmit()}>
        <input {...form.register("customerId")} placeholder="Customer ID" />
        <input {...form.register("totalAmount")} placeholder="Total Amount" type="number" />
        <input {...form.register("profitMargin")} placeholder="Profit Margin" type="number" />{" "}
        {/* Admin can see profit margin */}
        <button type="submit">Create Order</button>
      </form>

      {/* Orders Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Profit Margin</th> {/* Admin can see profit margin */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((order: AdminOrder) => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{order.customerId}</td>
              <td>${order.totalAmount}</td>
              <td>{order.profitMargin}%</td>{" "}
              {/* TypeScript knows this exists for Admin */}
              <td>
                <button onClick={() => order.delete(order._id)}>Delete</button>
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
// User gets limited access to the same data
import { Order, Roles, UserOrder } from "@kf-ai-sdk/app";

function UserOrderList() {
  const order = new Order(Roles.User);

  const table = useTable<UserOrder>({
    source: "orders",
    enableSorting: true,
  });

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Customer</th>
          <th>Amount</th>
          {/* <th>Profit Margin</th> */} {/* User cannot see profit margin */}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((order: UserOrder) => (
          <tr key={order._id}>
            <td>{order._id}</td>
            <td>{order.customerId}</td>
            <td>${order.totalAmount}</td>
            {/* <td>{order.profitMargin}%</td> */}{" "}
            {/* ❌ TypeScript Error: Property doesn't exist */}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Runtime API Operations

```tsx
import { api } from "@kf-ai-sdk/api";

// Runtime CRUD operations
async function orderOperations() {
  // Get single order by ID
  const order = await api("order").get("ORDER_123");

  // Create new order (with optional custom ID)
  const createResponse = await api("order").create({
    _id: "ORDER_456", // Optional custom ID
    customerId: "CUST_001",
    totalAmount: 299.99,
    status: "pending",
  });
  console.log(createResponse._id); // "ORDER_456"

  // Update order (partial updates supported)
  const updateResponse = await api("order").update("ORDER_123", {
    status: "completed",
    totalAmount: 325.50,
  });

  // Delete order
  const deleteResponse = await api("order").delete("ORDER_123");
  console.log(deleteResponse.status); // "success"

  // List orders with structured filtering and sorting
  const ordersList = await api("order").list({
    Filter: {
      Operator: "AND",
      Condition: [
        {
          Operator: "EQ",
          LHSField: "status", 
          RHSValue: "pending"
        },
        {
          Operator: "GTE",
          LHSField: "totalAmount",
          RHSValue: 100
        }
      ]
    },
    Sort: [
      { Field: "_created_at", Order: "DESC" },
      { Field: "totalAmount", Order: "ASC" }
    ],
    Page: 1,
    PageSize: 50
  });
}
```

## Advanced Filtering and Sorting Examples

The KF AI SDK supports comprehensive filtering and sorting through the Runtime API. Here are detailed examples using both Order and Product models:

### Basic Filtering Examples

```tsx
import { Order, Product, Roles } from "@kf-ai-sdk/app";

// Simple equality filter
const completedOrders = await new Order(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "status",
        RHSValue: "completed"
      }
    ]
  }
});

// Numeric range filter
const highValueOrders = await new Order(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "GTE",
        LHSField: "totalAmount",
        RHSValue: 500
      }
    ]
  }
});

// String contains filter
const electronicsProducts = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "Contains",
        LHSField: "description",
        RHSValue: "electronic"
      }
    ]
  }
});
```

### Complex Multi-Condition Filters

```tsx
// AND conditions - all must be true
const premiumCompletedOrders = await new Order(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "status",
        RHSValue: "completed"
      },
      {
        Operator: "GTE",
        LHSField: "totalAmount",
        RHSValue: 1000
      },
      {
        Operator: "GTE",
        LHSField: "profitMargin",
        RHSValue: 20
      }
    ]
  }
});

// OR conditions - any can be true
const urgentOrders = await new Order(Roles.Admin).list({
  Filter: {
    Operator: "OR",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "status",
        RHSValue: "pending"
      },
      {
        Operator: "EQ",
        LHSField: "status",
        RHSValue: "processing"
      }
    ]
  }
});

// Nested AND/OR conditions
const complexProductFilter = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "inStock",
        RHSValue: true
      },
      {
        Operator: "OR",
        Condition: [
          {
            Operator: "EQ",
            LHSField: "category",
            RHSValue: "electronics"
          },
          {
            Operator: "EQ",
            LHSField: "category",
            RHSValue: "clothing"
          }
        ]
      },
      {
        Operator: "Between",
        LHSField: "price",
        RHSValue: [50, 500]
      }
    ]
  }
});
```

### Advanced Filter Operators

```tsx
// Range queries
const midRangeProducts = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "Between",
        LHSField: "price",
        RHSValue: [100, 1000]
      }
    ]
  }
});

// List membership
const specificCategories = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "IN",
        LHSField: "category",
        RHSValue: ["electronics", "books", "sports"]
      }
    ]
  }
});

// Exclusion filters
const nonCancelledOrders = await new Order(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "NE",
        LHSField: "status",
        RHSValue: "cancelled"
      }
    ]
  }
});

// Empty/Non-empty checks
const ordersWithNotes = await new Order(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "NotEmpty",
        LHSField: "internalNotes"
      }
    ]
  }
});

// String length validation
const detailedProducts = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "MinLength",
        LHSField: "description",
        RHSValue: 50
      }
    ]
  }
});
```

### Comprehensive Sorting Examples

```tsx
// Single field sorting
const ordersByDate = await new Order(Roles.Admin).list({
  Sort: [
    { Field: "_created_at", Order: "DESC" }
  ]
});

// Multi-field sorting
const productsCatalog = await new Product(Roles.Admin).list({
  Sort: [
    { Field: "category", Order: "ASC" },    // First by category
    { Field: "price", Order: "DESC" },      // Then by price (high to low)
    { Field: "name", Order: "ASC" }         // Finally by name
  ]
});

// Sorting with filtering
const topSellingProducts = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "inStock",
        RHSValue: true
      },
      {
        Operator: "GTE",
        LHSField: "price",
        RHSValue: 100
      }
    ]
  },
  Sort: [
    { Field: "margin", Order: "DESC" },
    { Field: "price", Order: "ASC" }
  ]
});
```

### Pagination with Filtering and Sorting

```tsx
// Complete query with all features
const paginatedResults = await new Order(Roles.Admin).list({
  // Complex filtering
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "GTE",
        LHSField: "totalAmount",
        RHSValue: 200
      },
      {
        Operator: "OR",
        Condition: [
          {
            Operator: "EQ",
            LHSField: "status",
            RHSValue: "completed"
          },
          {
            Operator: "EQ",
            LHSField: "status",
            RHSValue: "pending"
          }
        ]
      }
    ]
  },
  // Multi-field sorting
  Sort: [
    { Field: "totalAmount", Order: "DESC" },
    { Field: "_created_at", Order: "DESC" }
  ],
  // Pagination
  Page: 1,
  PageSize: 25,
  // Specific fields only (optional)
  Field: ["_id", "customerId", "totalAmount", "status", "_created_at"]
});

// Process results
console.log(`Found ${paginatedResults.Data.length} orders`);
paginatedResults.Data.forEach(order => {
  console.log(`Order ${order._id}: $${order.totalAmount} - ${order.status}`);
});
```

### Role-Based Query Examples

```tsx
// Admin can see all fields and use sensitive filters
const adminProductAnalysis = await new Product(Roles.Admin).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "GTE",
        LHSField: "margin",        // Admin-only field
        RHSValue: 25
      },
      {
        Operator: "Contains",
        LHSField: "supplier",      // Admin-only field
        RHSValue: "Premium"
      }
    ]
  },
  Sort: [
    { Field: "margin", Order: "DESC" },
    { Field: "cost", Order: "ASC" }     // Admin-only field
  ]
});

// User sees limited data and can only filter on public fields
const userProducts = await new Product(Roles.User).list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "category",      // Public field
        RHSValue: "electronics"
      },
      {
        Operator: "EQ",
        LHSField: "inStock",       // Public field
        RHSValue: true
      }
    ]
  },
  Sort: [
    { Field: "price", Order: "ASC" },    // Public field
    { Field: "name", Order: "ASC" }      // Public field
  ]
});

// Note: User cannot filter by margin, cost, or supplier - those fields don't exist in UserProduct type
```

### Real-World Query Patterns

```tsx
// E-commerce product search
async function searchProducts(searchTerm: string, category?: string, maxPrice?: number) {
  const conditions = [
    {
      Operator: "EQ" as const,
      LHSField: "inStock",
      RHSValue: true
    }
  ];

  if (searchTerm) {
    conditions.push({
      Operator: "Contains" as const,
      LHSField: "name",
      RHSValue: searchTerm
    });
  }

  if (category) {
    conditions.push({
      Operator: "EQ" as const,
      LHSField: "category",
      RHSValue: category
    });
  }

  if (maxPrice) {
    conditions.push({
      Operator: "LTE" as const,
      LHSField: "price",
      RHSValue: maxPrice
    });
  }

  return new Product(Roles.User).list({
    Filter: {
      Operator: "AND",
      Condition: conditions
    },
    Sort: [
      { Field: "name", Order: "ASC" }
    ],
    PageSize: 20
  });
}

// Order dashboard with filters
async function getOrderDashboard(dateRange: { start: string, end: string }, minAmount?: number) {
  const conditions = [
    {
      Operator: "Between" as const,
      LHSField: "_created_at",
      RHSValue: [dateRange.start, dateRange.end]
    }
  ];

  if (minAmount) {
    conditions.push({
      Operator: "GTE" as const,
      LHSField: "totalAmount",
      RHSValue: minAmount
    });
  }

  return new Order(Roles.Admin).list({
    Filter: {
      Operator: "AND",
      Condition: conditions
    },
    Sort: [
      { Field: "totalAmount", Order: "DESC" },
      { Field: "_created_at", Order: "DESC" }
    ],
    PageSize: 50
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

### API Layer (`api/`)

- ✅ **Runtime CRUD Operations** - get, create, update, delete, list
- ✅ **Business Object Interface** - Clean `api('bo_id').method()` syntax
- ✅ **Structured Filtering** - Complex filters with AND/OR/nested conditions
- ✅ **Advanced Sorting** - Multi-field sorting with ASC/DESC directions
- ✅ **Datetime Handling** - Automatic encoding/decoding of API datetime formats
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
          <tr key={order._id}>
            <td>{order._id}</td>
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

// If AI tries to generate user code that accesses admin fields:
function UserOrderList() {
  const order = new Order(Roles.User);
  const data = await order.get("123");

  return <div>{data.profitMargin}</div>; // ❌ TypeScript Error!
  // Property 'profitMargin' does not exist on type 'UserOrder'
}
```

**The AI sees the TypeScript error and automatically regenerates correct code.**

## License

MIT
