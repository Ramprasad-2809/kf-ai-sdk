# API Client - Simple CRUD Operations

The API Client provides a clean, chainable interface for basic CRUD operations. It focuses on simplicity and consistency without the complexity of filters or React Query integration.

## Overview

The API client provides 5 core methods for data operations:

- `get(id)` - Retrieve a single record
- `create(data)` - Create a new record  
- `update(id, data)` - Update an existing record
- `delete(id)` - Delete a record
- `list(options)` - List records with basic pagination and sorting

## Basic Usage

```tsx
import { api } from "@kf-ai-sdk/api";

// Simple operations
const user = await api("users").get("user_123");
const users = await api("users").list();
const newUser = await api("users").create({ name: "John", email: "john@example.com" });
const updatedUser = await api("users").update("user_123", { status: "active" });
await api("users").delete("user_123");
```

## Methods

### get(id)

Retrieve a single record by ID.

```tsx
const user = await api("users").get("user_123");
const product = await api("products").get("prod_456");
```

**Parameters:**
- `id: string` - The unique identifier for the record

**Returns:** `Promise<T>` - The requested record

### create(data)

Create a new record.

```tsx
const newUser = await api("users").create({
  name: "John Doe",
  email: "john@example.com",
  status: "active"
});

const newProduct = await api("products").create({
  name: "Widget",
  price: 99.99,
  category: "gadgets"
});
```

**Parameters:**
- `data: object` - The data for the new record

**Returns:** `Promise<T>` - The created record with generated ID

### update(id, data)

Update an existing record.

```tsx
const updatedUser = await api("users").update("user_123", {
  status: "inactive",
  lastLogin: new Date()
});

const updatedProduct = await api("products").update("prod_456", {
  price: 89.99,
  inStock: true
});
```

**Parameters:**
- `id: string` - The unique identifier for the record
- `data: object` - The fields to update

**Returns:** `Promise<T>` - The updated record

### delete(id)

Delete a record by ID.

```tsx
await api("users").delete("user_123");
await api("products").delete("prod_456");
```

**Parameters:**
- `id: string` - The unique identifier for the record

**Returns:** `Promise<void>` - Resolves when deletion is complete

### list(options)

List records with optional pagination and sorting.

```tsx
// Basic listing
const users = await api("users").list();

// With pagination
const products = await api("products").list({
  pageNo: 1,
  pageSize: 20
});

// With sorting
const sortedUsers = await api("users").list({
  sort: [{ field: "name", direction: "asc" }]
});

// With search
const searchResults = await api("users").list({
  q: "john",
  pageSize: 10
});

// Combined options
const results = await api("orders").list({
  pageNo: 1,
  pageSize: 25,
  sort: [
    { field: "createdAt", direction: "desc" },
    { field: "status", direction: "asc" }
  ],
  q: "pending"
});
```

**Parameters:**
- `options?: ListOptions` - Optional configuration object

```tsx
interface ListOptions {
  pageNo?: number;        // Page number (1-based)
  pageSize?: number;      // Number of records per page
  sort?: SortOption[];    // Sort configuration
  q?: string;             // Search query
}

interface SortOption {
  field: string;
  direction: "asc" | "desc";
}
```

**Returns:** `Promise<ListResponse<T>>` - Paginated results

```tsx
interface ListResponse<T> {
  data: T[];           // Array of records
  total: number;       // Total number of records
  pageNo: number;      // Current page number
  pageSize: number;    // Records per page
  totalPages: number;  // Total number of pages
}
```

## TypeScript Support

The API client supports full TypeScript typing:

```tsx
interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
}

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

// Typed operations
const user: User = await api("users").get("user_123");
const users: ListResponse<User> = await api("users").list();
const newUser: User = await api("users").create({
  name: "John",
  email: "john@example.com"
});
```

## Error Handling

All API operations return promises that can be handled with try/catch:

```tsx
try {
  const user = await api("users").get("user_123");
  console.log("User found:", user);
} catch (error) {
  if (error.status === 404) {
    console.log("User not found");
  } else {
    console.error("API error:", error.message);
  }
}

try {
  const newUser = await api("users").create({
    name: "John",
    email: "invalid-email" // Invalid data
  });
} catch (error) {
  if (error.status === 400) {
    console.log("Validation errors:", error.details);
  } else {
    console.error("Creation failed:", error.message);
  }
}
```

## Configuration

### Base URL

Configure the base URL for all API requests:

```tsx
import { setApiBaseUrl } from "@kf-ai-sdk/api";

setApiBaseUrl("https://api.example.com/v1");
```

### Headers

Set default headers for all requests:

```tsx
import { setDefaultHeaders } from "@kf-ai-sdk/api";

setDefaultHeaders({
  "Authorization": "Bearer your-token-here",
  "Content-Type": "application/json"
});
```

### Request Interceptors

Add custom request/response handling:

```tsx
import { addRequestInterceptor, addResponseInterceptor } from "@kf-ai-sdk/api";

// Add authentication token
addRequestInterceptor((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle common error responses
addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

## Examples

### User Management

```tsx
import { api } from "@kf-ai-sdk/api";

class UserService {
  async getAllUsers() {
    return api("users").list();
  }
  
  async getUserById(id: string) {
    return api("users").get(id);
  }
  
  async createUser(userData: Partial<User>) {
    return api("users").create(userData);
  }
  
  async updateUserStatus(id: string, status: string) {
    return api("users").update(id, { status });
  }
  
  async deleteUser(id: string) {
    return api("users").delete(id);
  }
  
  async searchUsers(query: string) {
    return api("users").list({ q: query, pageSize: 50 });
  }
  
  async getPaginatedUsers(page: number, size: number = 20) {
    return api("users").list({
      pageNo: page,
      pageSize: size,
      sort: [{ field: "name", direction: "asc" }]
    });
  }
}
```

### Product Catalog

```tsx
import { api } from "@kf-ai-sdk/api";

class ProductService {
  async getFeaturedProducts() {
    return api("products").list({
      pageSize: 10,
      sort: [{ field: "featured", direction: "desc" }]
    });
  }
  
  async getProductsByCategory(category: string) {
    return api("products").list({
      q: category,
      sort: [{ field: "price", direction: "asc" }]
    });
  }
  
  async updateProductPrice(id: string, price: number) {
    return api("products").update(id, { price });
  }
  
  async toggleProductStock(id: string, inStock: boolean) {
    return api("products").update(id, { inStock });
  }
}
```

### Order Processing

```tsx
import { api } from "@kf-ai-sdk/api";

class OrderService {
  async getRecentOrders() {
    return api("orders").list({
      pageNo: 1,
      pageSize: 25,
      sort: [{ field: "createdAt", direction: "desc" }]
    });
  }
  
  async getOrdersByStatus(status: string) {
    return api("orders").list({
      q: status,
      sort: [{ field: "createdAt", direction: "desc" }]
    });
  }
  
  async updateOrderStatus(id: string, status: string) {
    return api("orders").update(id, { 
      status,
      updatedAt: new Date()
    });
  }
  
  async createOrder(orderData: Partial<Order>) {
    return api("orders").create({
      ...orderData,
      createdAt: new Date(),
      status: "pending"
    });
  }
}
```

## Integration with App Layer

The API client is used by the App layer for actual data operations:

```tsx
// In sdk/app/sources/user.ts
export class User<TRole extends Role> {
  async list(): Promise<ListResponse<UserForRole<TRole>>> {
    return api("users").list(); // Uses this API client
  }
  
  async get(id: IdField): Promise<UserForRole<TRole>> {
    return api("users").get(id); // Uses this API client
  }
}
```

The API client provides the networking layer while the App layer provides the type safety and role-based access control.

## Best Practices

1. **Use TypeScript interfaces** - Define clear types for your data models
2. **Handle errors consistently** - Always wrap API calls in try/catch
3. **Configure once** - Set base URL and headers at app startup
4. **Use semantic resource names** - `api("users")` not `api("user_management")`
5. **Leverage pagination** - Use pageSize to control data volume
6. **Sort by default** - Provide consistent ordering for list operations

## Limitations

This API client is intentionally simple and does not include:

- Advanced filtering (use Components layer for complex filters)
- React Query integration (use Components layer for caching)
- Request cancellation
- Offline support
- Automatic retries

For advanced features, use the Components layer which builds on top of this API client.