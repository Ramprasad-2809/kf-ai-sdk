# App SDK - Type-Safe Contracts with Role-Based Access Control

The App SDK serves as the **type-safe contract layer** between AI-generated frontend code and backend APIs. It provides AI-readable type definitions with role-based access control, ensuring that generated code respects user permissions and fails at compile-time if incorrect.

## Purpose

### The AI Code Generation Problem

When AI generates a React admin page for "Order Management", it needs to know:
- What API methods to call (`order.list()`, `order.get()`)
- What fields are available (`id`, `customerId`, `totalAmount`, etc.)
- What fields are permitted for the current role (admin vs employee)
- What filters and options are supported

**Without the App SDK**: AI guesses, generates incorrect code, runtime errors occur.

**With the App SDK**: AI reads type definitions, generates type-safe code, TypeScript catches errors at compile-time.

## Architecture

### Core Components

1. **Base Field Types** (`types/base-fields.ts`) - Semantic field types
2. **Roles** (`types/roles.ts`) - Role constants and type definitions
3. **Common Types** (`types/common.ts`) - Shared interfaces
4. **Sources** (`sources/*.ts`) - Data model definitions with role-based views

### Type Safety Flow

```
AI Reads App SDK
       ↓
Generates Type-Safe Code
       ↓
TypeScript Compiles
       ↓
Any Error = Incorrect Generation
       ↓
AI Regenerates Correctly
```

## Quick Start

```tsx
// 1. AI reads this import for available types
import { User, Roles, AdminUser } from "@kf-ai-sdk/app";

// 2. AI generates role-specific code
function AdminUserPage() {
  const user = new User(Roles.Admin);
  
  const userData = await user.get("user_123");
  // userData is typed as AdminUser
  
  return (
    <div>
      <p>Name: {userData.name}</p>
      <p>Email: {userData.email}</p>
      <p>Salary: {userData.salary}</p> {/* ✅ Admin can see salary */}
    </div>
  );
}

// 3. If AI generates employee code with admin fields:
function EmployeeUserPage() {
  const user = new User(Roles.Employee);
  const userData = await user.get("user_123");
  
  return (
    <div>
      <p>Salary: {userData.salary}</p> {/* ❌ TypeScript Error! */}
      // Property 'salary' does not exist on type 'EmployeeUser'
    </div>
  );
}
```

## Role-Based Access Control

### Example: Order Source

```tsx
// Full schema (all fields in backend)
export type OrderType = {
  id: IdField;
  customerId: IdField;
  totalAmount: NumberField;
  status: StringField<"pending" | "completed" | "cancelled">;
  createdAt: DateField;
  internalNotes: StringField;
  profitMargin: NumberField;
};

// Role-based views
export type AdminOrder = OrderType; // All fields
export type ManagerOrder = Omit<OrderType, "internalNotes">; // No internal notes
export type EmployeeOrder = Pick<OrderType, "id" | "status" | "createdAt">; // Limited fields

// Conditional type mapper
export type OrderForRole<TRole extends Role> =
  TRole extends typeof Roles.Admin
    ? AdminOrder
    : TRole extends typeof Roles.Manager
    ? ManagerOrder
    : TRole extends typeof Roles.Employee
    ? EmployeeOrder
    : never;

// Type-safe class
export class Order<TRole extends Role = typeof Roles.Admin> {
  constructor(private role: TRole) {}
  
  async get(id: IdField): Promise<OrderForRole<TRole>> {
    return api("orders").get(id);
  }
  
  async list(): Promise<ListResponse<OrderForRole<TRole>>> {
    return api("orders").list();
  }
}
```

### AI Code Generation Examples

**Admin Code (Generated)**:
```tsx
const order = new Order(Roles.Admin);
const data = await order.get("123");
console.log(data.totalAmount); // ✅ Works - AdminOrder has this field
console.log(data.profitMargin); // ✅ Works - AdminOrder has this field
```

**Employee Code (Generated)**:
```tsx
const order = new Order(Roles.Employee);
const data = await order.get("123");
console.log(data.status); // ✅ Works - EmployeeOrder has this field
console.log(data.totalAmount); // ❌ TypeScript Error - Field not available
```

## Type System

### Base Field Types

Semantic field types that provide meaning while resolving to TypeScript primitives:

```tsx
// types/base-fields.ts
export type IdField = string;           // Semantic: ID field
export type StringField<T = string> = T; // Semantic: String with optional literal type
export type NumberField = number;       // Semantic: Numeric field
export type DateField = Date;          // Semantic: Date field
export type BooleanField = boolean;    // Semantic: Boolean field
```

**Benefits**:
- AI understands field intent (ID vs generic string)
- Self-documenting type definitions
- Zero runtime overhead (pure type aliases)
- Preserve literal types for enums

### Role Constants

Type-safe role definitions that prevent arbitrary strings:

```tsx
// types/roles.ts
export const Roles = {
  Admin: "admin",
  Manager: "manager", 
  Employee: "employee",
  Guest: "guest",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
```

**Usage**:
```tsx
const user = new User(Roles.Admin); // ✅ Type-safe
const user = new User("admin");     // ❌ TypeScript Error
```

## Source Implementation Pattern

Every data model follows this exact pattern:

```tsx
// 1. Import base types
import { IdField, StringField, NumberField } from "../types/base-fields";
import { Role, Roles } from "../types/roles";
import { ListResponse, ListOptions } from "../types/common";

// 2. Define complete type using semantic field types
export type SourceType = {
  id: IdField;
  name: StringField;
  status: StringField<"active" | "inactive">;
  // ... other fields
};

// 3. Define role-based views
export type AdminSource = SourceType;
export type EmployeeSource = Pick<SourceType, "id" | "name">;

// 4. Create conditional type mapper
export type SourceForRole<TRole extends Role> =
  TRole extends typeof Roles.Admin
    ? AdminSource
    : TRole extends typeof Roles.Employee
    ? EmployeeSource
    : never;

// 5. Implement type-safe class
export class Source<TRole extends Role = typeof Roles.Admin> {
  constructor(private role: TRole) {}
  
  async list(): Promise<ListResponse<SourceForRole<TRole>>> {
    return api("source").list();
  }
  
  async get(id: IdField): Promise<SourceForRole<TRole>> {
    return api("source").get(id);
  }
  
  async create(data: Partial<SourceForRole<TRole>>): Promise<SourceForRole<TRole>> {
    return api("source").create(data);
  }
  
  async update(id: IdField, data: Partial<SourceForRole<TRole>>): Promise<SourceForRole<TRole>> {
    return api("source").update(id, data);
  }
  
  async delete(id: IdField): Promise<void> {
    if (this.role !== Roles.Admin) {
      throw new Error("Only admins can delete");
    }
    return api("source").delete(id);
  }
}
```

## Adding New Sources

To add a new data model (e.g., `Product`):

1. **Create `sources/product.ts`**:
```tsx
export type ProductType = {
  id: IdField;
  name: StringField;
  price: NumberField;
  cost: NumberField; // Admin only
};

export type AdminProduct = ProductType;
export type EmployeeProduct = Omit<ProductType, "cost">;

export type ProductForRole<TRole extends Role> = 
  TRole extends typeof Roles.Admin ? AdminProduct
  : TRole extends typeof Roles.Employee ? EmployeeProduct
  : never;

export class Product<TRole extends Role = typeof Roles.Admin> {
  // ... implement methods following pattern
}
```

2. **Export from `index.ts`**:
```tsx
export { Product } from "./sources/product";
export type { ProductType, AdminProduct, EmployeeProduct, ProductForRole } from "./sources/product";
```

3. **AI can now use it**:
```tsx
import { Product, Roles } from "@kf-ai-sdk/app";

const product = new Product(Roles.Admin);
const products = await product.list();
```

## Adding New Roles

To add a new role (e.g., `Viewer`):

1. **Update `types/roles.ts`**:
```tsx
export const Roles = {
  Admin: "admin",
  Manager: "manager",
  Employee: "employee",
  Viewer: "viewer", // ← New role
  Guest: "guest",
} as const;
```

2. **Update each source's conditional type**:
```tsx
export type OrderForRole<TRole extends Role> =
  TRole extends typeof Roles.Admin ? AdminOrder
  : TRole extends typeof Roles.Manager ? ManagerOrder
  : TRole extends typeof Roles.Employee ? EmployeeOrder
  : TRole extends typeof Roles.Viewer ? ViewerOrder // ← Add here
  : TRole extends typeof Roles.Guest ? GuestOrder
  : never;
```

## File Structure

```
sdk/app/
├── types/
│   ├── base-fields.ts    # IdField, StringField, NumberField, etc.
│   ├── roles.ts          # Roles constant, Role type, utilities  
│   └── common.ts         # ListResponse, ListOptions, shared types
├── sources/
│   ├── user.ts           # Complete User source with role views
│   ├── order.ts          # Complete Order source with role views
│   └── *.ts              # Other data models
└── index.ts              # Main exports for AI consumption
```

## AI Integration

The App SDK is designed to be easily parsed by AI:

### 1. Single Entry Point
```tsx
// AI imports everything from one place
import { User, Order, Product, Roles, AdminUser } from "@kf-ai-sdk/app";
```

### 2. Self-Documenting Types
```tsx
// AI can read JSDoc comments and field types
export type UserType = {
  /** Unique user identifier */
  id: IdField;
  
  /** User's full name */
  name: StringField;
  
  /** User's salary (admin only) */
  salary: NumberField;
};
```

### 3. Explicit Patterns
```tsx
// AI learns the pattern and applies it consistently
const user = new User(Roles.Admin);     // Always use Roles constant
const data = await user.list();         // Standard method names
const item = await user.get(id);        // Consistent parameter types
```

### 4. Compile-Time Validation
- Any TypeScript error indicates incorrect AI generation
- AI can see error messages and regenerate correctly
- No runtime surprises - everything validated at compile-time

## Best Practices

1. **Use semantic field types** - `IdField` vs `string` conveys intent
2. **Define comprehensive role views** - Cover all permission scenarios  
3. **Follow naming conventions** - `SourceType`, `AdminSource`, etc.
4. **Document field purposes** - Add JSDoc comments for AI
5. **Keep single source files** - All logic for a model in one place
6. **Export everything from index** - Single entry point for AI

## Integration with Other Layers

### With API Layer
```tsx
// App SDK uses API layer for actual operations
export class User<TRole extends Role> {
  async list(): Promise<ListResponse<UserForRole<TRole>>> {
    return api("users").list(); // Uses sdk/api
  }
}
```

### With Components Layer
```tsx
// Components use App SDK types for type safety
import { AdminUser } from "@kf-ai-sdk/app";

const table = useTable<AdminUser>({
  source: "users",
  // TypeScript ensures table.rows is AdminUser[]
});
```

This architecture ensures that AI-generated code is always type-safe and respects role-based permissions, with TypeScript serving as the validation layer for correct AI generation.