# KF AI SDK - Enhanced Business Object Framework

A comprehensive TypeScript SDK for building enterprise applications with sophisticated business rules, role-based access control, and optimized client-side validation. Features complete BDO (Business Data Object) support with rule classification, field permissions, and expression evaluation.

## 🚀 Latest Enhancements

### ✅ **Complete Rule System (NEW)**
- **Rule Classification**: Validation (client-side), Computation (server-side), Business Logic (server-side)
- **Smart Execution**: Automatic determination of client vs server rule execution
- **Expression Caching**: LRU cache with dependency tracking for optimized performance
- **BDO Schema Support**: Full compatibility with Business Data Object schemas

### ✅ **Role-Based Field Permissions (NEW)**  
- **Field-Level Control**: Editable, readable, and hidden field permissions per role
- **Compile-Time Safety**: TypeScript enforcement of permission boundaries
- **Dynamic UI**: Automatic form field disable/hide based on permissions

### ✅ **Optimized API Integration (NEW)**
- **POST-Based Operations**: Correct implementation per BDO specification  
- **Enhanced Count API**: Efficient counting with same payload structure as list
- **Advanced Filtering**: Complex filter conditions with logical operators
- **Type-Safe Responses**: Full TypeScript coverage for all operations

### ✅ **Amazon Product Master Implementation (NEW)**
- **Complete BDO Example**: Full implementation of Amazon Product Master schema
- **Business Rules**: Auto-calculations, validation, and permission enforcement  
- **Role-Based Views**: Admin, Seller, Buyer, InventoryManager, WarehouseStaff access levels
- **Real-World Example**: Production-ready e-commerce product management

## 📚 Documentation

- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Comprehensive setup and usage guide
- **[Quick Reference](./QUICK_REFERENCE.md)** - Developer cheat sheet and API reference
- **[Examples](./examples/)** - Real-world usage examples including Amazon Product demo

## Architecture Overview

The KF AI SDK is built on a clear separation between reusable SDK core and user-configurable application logic:

### 🔧 SDK Core (`sdk/`)

**Fixed, Reusable Components**

- **Types**: 11 Backend BO field types (IdField, StringField, CurrencyField, etc.)
- **API Client**: Runtime CRUD operations with structured filtering and sorting
- **Utilities**: Validation and formatting helpers
- **Components**: React hooks for forms and tables (Phase 2)

### 🏗️ App Layer (`app/`)

**User-Configurable Business Logic**

- **Roles**: User-defined role system (Admin, Manager, User, etc.)
- **Sources**: Business object definitions (Product, Order, etc.)
- **Role-based Access**: Type-safe field visibility per role
- **AI-readable Contracts**: Single source of truth for code generation

### 📁 Project Structure

```
kf-ai-sdk/
├── sdk/                    # Fixed SDK core
│   ├── types/              # Field types and common interfaces
│   ├── api/                # API client and utilities
│   ├── utils/              # Validation and formatting
│   └── index.ts            # SDK exports
├── app/                    # User-configurable layer
│   ├── types/roles.ts      # Role definitions
│   ├── sources/            # Business objects
│   └── index.ts            # App exports
├── config/                 # Development configuration
└── examples/               # Usage examples
```

## Quick Start

### Usage Example

```tsx
// 1. Import SDK core utilities
import { api, formatCurrency, isValidCurrencyField } from "./sdk";

// 2. Import app-specific business logic  
import { Order, Roles, AdminOrder } from "./app";

// 3. Use together for type-safe operations
const order = new Order(Roles.Admin);
const orderData = await order.list();

// SDK utilities work with app types
const isValid = isValidCurrencyField(orderData.Data[0].totalAmount);
const formatted = formatCurrency(orderData.Data[0].totalAmount);

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
import { api } from "./sdk";

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
import { Order, Product, Roles } from "./app";

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

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone or download the SDK template
git clone kf-ai-sdk my-project
cd my-project

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # Run TypeScript checks
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run tests
```

### Configuration
The SDK uses configuration files in the `config/` directory:
- `tsconfig.json` - TypeScript configuration with path mapping
- `vite.config.js` - Build and development server config
- `eslint.config.js` - Code linting rules
- `prettier.config.js` - Code formatting rules

### Layer Documentation

- **[SDK Core](docs/sdk-core.md)** - Field types, API client, and utilities
- **[App Layer](docs/app-layer.md)** - Roles and business object creation
- **[Examples](docs/examples.md)** - Usage patterns and best practices

### Migration Guide

- **[Migration Guide](MIGRATION.md)** - Upgrading from the previous structure

## Features

### SDK Core (`sdk/`)

- ✅ **Field Type System** - 11 Backend BO field types with semantic meaning
- ✅ **Runtime API Client** - Full CRUD operations with structured filtering
- ✅ **Datetime Handling** - Automatic encoding/decoding of API formats
- ✅ **Validation Utilities** - Runtime type checking and field validation
- ✅ **Formatting Helpers** - Display formatting for all field types
- ✅ **TypeScript Support** - Full type safety across all operations

### App Layer (`app/`)

- ✅ **Role-Based Access Control** - Compile-time enforcement of field visibility
- ✅ **AI Code Generation** - Single source of truth for AI-readable contracts
- ✅ **Dynamic Business Objects** - User-configurable source definitions
- ✅ **Custom Role System** - User-defined role hierarchies
- ✅ **Type Safety** - TypeScript validation of all generated code
- ✅ **Single File Per Source** - All logic for a data model in one place

### Development Experience

- ✅ **Modern Build Tools** - Vite, TypeScript, ESLint, Prettier
- ✅ **Path Mapping** - Clean imports with `@sdk/` and `@app/` aliases
- ✅ **Hot Reload** - Fast development with instant feedback
- ✅ **Type Checking** - Comprehensive TypeScript validation
- ✅ **Code Quality** - Automated linting and formatting

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
