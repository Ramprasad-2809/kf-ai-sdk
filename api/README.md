# API Documentation

A simple, chainable API client for CRUD operations with integrated filter support, designed to work seamlessly with React Query.

## Overview

The API client provides 5 core methods for data operations:

- `get(id)` - Retrieve a single record
- `create(data)` - Create a new record
- `update(id, data)` - Update an existing record
- `delete(id)` - Delete a record
- `list(options)` - List records with filtering, sorting, and pagination

## Usage Patterns

### With React Query (Recommended)

```typescript
// For queries
const usersQuery = useQuery({
  queryKey: ["users", "list"],
  queryFn: api("users").list(),
});

// For mutations
const createUserMutation = useMutation({
  mutationFn: api("users").create(),
});
```

### Direct Usage (Legacy)

```typescript
const result = await api("resource").method(params);
```

## Methods

### get(id)

Retrieve a single record by ID.

```typescript
// With React Query (Recommended)
const userQuery = useQuery({
  queryKey: ["users", "user_1"],
  queryFn: () => api("users").get("user_1"),
});

const productQuery = useQuery({
  queryKey: ["products", "prod_123"],
  queryFn: () => api("products").get("prod_123"),
});

// Direct usage
const user = await api("users").get("user_1");
const product = await api("products").get("prod_123");
```

**Parameters:**

- `id: string` - The unique identifier for the record

**Returns:** `Promise<T>` - The requested record

### create(data)

Create a new record.

```typescript
// With React Query (Recommended)
const createUserMutation = useMutation({
  mutationFn: api("users").create(),
  onSuccess: (newUser) => {
    // Invalidate users list to refetch
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});

// Usage
createUserMutation.mutate({
  name: "John Doe",
  email: "john@example.com",
  status: "active",
});

// Direct usage
const newUser = await api("users").create({
  name: "John Doe",
  email: "john@example.com",
  status: "active",
});
```

**Parameters:**

- `data: object` - The data for the new record

**Returns:** `Promise<T>` - The created record with generated ID

### update(id, data)

Update an existing record.

```typescript
// With React Query (Recommended)
const updateUserMutation = useMutation({
  mutationFn: ({ id, data }) => api("users").update(id, data),
  onSuccess: (updatedUser, { id }) => {
    // Update cached user data
    queryClient.setQueryData(["users", id], updatedUser);
    // Invalidate users list
    queryClient.invalidateQueries({ queryKey: ["users", "list"] });
  },
});

// Usage
updateUserMutation.mutate({
  id: "user_1",
  data: {
    status: "inactive",
    lastLogin: new Date(),
  },
});

// Direct usage
const updatedUser = await api("users").update("user_1", {
  status: "inactive",
  lastLogin: new Date(),
});
```

**Parameters:**

- `id: string` - The unique identifier for the record
- `data: object` - The fields to update

**Returns:** `Promise<T>` - The updated record

### delete(id)

Delete a record by ID.

```typescript
// With React Query (Recommended)
const deleteUserMutation = useMutation({
  mutationFn: api("users").delete,
  onSuccess: (_, deletedId) => {
    // Remove from cache
    queryClient.removeQueries({ queryKey: ["users", deletedId] });
    // Invalidate users list
    queryClient.invalidateQueries({ queryKey: ["users", "list"] });
  },
});

// Usage
deleteUserMutation.mutate("user_1");

// Direct usage
await api("users").delete("user_1");
```

**Parameters:**

- `id: string` - The unique identifier for the record

**Returns:** `Promise<void>` - Resolves when deletion is complete

### list(options)

List records with optional filtering, sorting, and pagination.

```typescript
// With React Query (Recommended)
const usersListQuery = useQuery({
  queryKey: ["users", "list"],
  queryFn: () => api("users").list(),
});

// With pagination
const productsQuery = useQuery({
  queryKey: ["products", "list", { pageNo: 1, pageSize: 20 }],
  queryFn: () =>
    api("products").list({
      pageNo: 1,
      pageSize: 20,
    }),
});

// With search
const searchQuery = useQuery({
  queryKey: ["users", "search", "john"],
  queryFn: () =>
    api("users").list({
      q: "john",
      pageSize: 10,
    }),
  enabled: !!searchTerm, // Only run when there's a search term
});

// With sorting
const sortedProductsQuery = useQuery({
  queryKey: ["products", "list", { sort: "price:desc" }],
  queryFn: () =>
    api("products").list({
      sort: [{ field: "price", direction: "desc" }],
    }),
});

// Direct usage
const users = await api("users").list();
```

**Parameters:**

- `options?: ListOptions` - Optional configuration object

```typescript
interface ListOptions {
  filter?: FilterJSON; // Filter using the filter SDK
  sort?: SortOption[]; // Sort configuration
  pageNo?: number; // Page number (1-based)
  pageSize?: number; // Number of records per page
  q?: string; // Search query
}

interface SortOption {
  field: string;
  direction: "asc" | "desc";
}
```

**Returns:** `Promise<ListResponse<T>>` - Paginated results

```typescript
interface ListResponse<T> {
  data: T[];
  total: number;
  pageNo: number;
  pageSize: number;
  totalPages: number;
}
```

## Integration with Filter SDK

The `list` method integrates seamlessly with the headless filter builder and React Query:

```typescript
import { useFilter } from "@kf-ai-sdk/headless-filter";
import { useQuery } from "@tanstack/react-query";

function UserList() {
  const filter = useFilter();

  // Build your filter
  filter.addCondition(null, {
    field: "status",
    operator: "EQUALS",
    value: "active",
  });

  filter.addCondition(null, {
    field: "department",
    operator: "EQUALS",
    value: "engineering",
  });

  // Use filter with React Query
  const usersQuery = useQuery({
    queryKey: ["users", "filtered", filter.json],
    queryFn: () =>
      api("users").list({
        filter: filter.json,
        pageSize: 50,
        sort: [{ field: "name", direction: "asc" }],
      }),
    enabled: !filter.isEmpty, // Only fetch when filter is not empty
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (usersQuery.isLoading) {
    return <div>Loading users...</div>;
  }

  if (usersQuery.error) {
    return <div>Error: {usersQuery.error.message}</div>;
  }

  return (
    <div>
      {/* Your filter UI */}
      {/* Your user list */}
      {usersQuery.data?.data.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

## Advanced List Examples

### Complex Filtering with Nested Groups

```typescript
function AdminUsersTable() {
  const filter = useFilter();

  // Create OR group for roles
  const roleGroup = filter.addGroup(null, "OR");
  filter.addCondition(roleGroup, {
    field: "role",
    operator: "EQUALS",
    value: "admin",
  });
  filter.addCondition(roleGroup, {
    field: "role",
    operator: "EQUALS",
    value: "moderator",
  });

  // Add root-level condition
  filter.addCondition(null, {
    field: "isActive",
    operator: "EQUALS",
    value: "true",
  });

  // Query: (role = 'admin' OR role = 'moderator') AND isActive = true
  const usersQuery = useQuery({
    queryKey: ["users", "admins", filter.json],
    queryFn: () =>
      api("users").list({
        filter: filter.json,
        sort: [
          { field: "role", direction: "asc" },
          { field: "name", direction: "asc" },
        ],
        pageNo: 1,
        pageSize: 25,
      }),
    enabled: !filter.isEmpty,
  });

  return (
    <div>
      {usersQuery.data?.data.map((user) => (
        <div key={user.id}>
          {user.name} - {user.role}
        </div>
      ))}
    </div>
  );
}
```

### Date Range Filtering

```typescript
function OrdersThisYear() {
  const filter = useFilter();

  filter.addCondition(null, {
    field: "createdAt",
    operator: "GREATER_THAN_OR_EQUAL_TO",
    value: "2024-01-01",
  });

  filter.addCondition(null, {
    field: "createdAt",
    operator: "LESS_THAN",
    value: "2024-12-31",
  });

  const ordersQuery = useQuery({
    queryKey: ["orders", "2024", filter.json],
    queryFn: () =>
      api("orders").list({
        filter: filter.json,
        sort: [{ field: "createdAt", direction: "desc" }],
      }),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return (
    <div>
      {ordersQuery.isLoading && <div>Loading orders...</div>}
      {ordersQuery.data?.data.map((order) => (
        <div key={order.id}>
          Order #{order.id} - {order.createdAt}
        </div>
      ))}
    </div>
  );
}
```

### Field-to-Field Comparisons

```typescript
const filter = useFilter();

// Find products where sale price is less than regular price
filter.addCondition(null, {
  field: "salePrice",
  operator: "LESS_THAN",
  rhsType: "Field",
  compareField: "regularPrice",
});

const saleProducts = await api("products").list({
  filter: filter.json,
  sort: [{ field: "salePrice", direction: "asc" }],
});
```

### Search with Filters

```typescript
function ProductSearch({ searchTerm }) {
  const filter = useFilter();

  filter.addCondition(null, {
    field: "category",
    operator: "EQUALS",
    value: "electronics",
  });

  filter.addCondition(null, {
    field: "inStock",
    operator: "EQUALS",
    value: "true",
  });

  // Search for products within electronics category, in stock items only
  const productsQuery = useQuery({
    queryKey: ["products", "search", searchTerm, filter.json],
    queryFn: () =>
      api("products").list({
        filter: filter.json,
        q: searchTerm,
        sort: [{ field: "price", direction: "asc" }],
        pageSize: 20,
      }),
    enabled: !!searchTerm && searchTerm.length >= 2, // Only search with 2+ characters
    staleTime: 30 * 1000, // Cache for 30 seconds (search results change frequently)
  });

  return (
    <div>
      {productsQuery.isFetching && <div>Searching...</div>}
      {productsQuery.data?.data.map((product) => (
        <div key={product.id}>
          {product.name} - ${product.price}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

### With React Query (Recommended)

```typescript
function UserProfile({ userId }) {
  const userQuery = useQuery({
    queryKey: ["users", userId],
    queryFn: () => api("users").get(userId),
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
  });

  if (userQuery.isLoading) {
    return <div>Loading user...</div>;
  }

  if (userQuery.error) {
    if (userQuery.error.status === 404) {
      return <div>User not found</div>;
    }
    return <div>Error: {userQuery.error.message}</div>;
  }

  return <div>User: {userQuery.data.name}</div>;
}
```

### Direct Usage

```typescript
try {
  const user = await api("users").get("user_1");
  console.log(user);
} catch (error) {
  if (error.status === 404) {
    console.log("User not found");
  } else {
    console.error("API error:", error.message);
  }
}
```

## TypeScript Support

The API client supports full TypeScript typing with React Query:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  department: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

// Typed React Query calls
const userQuery = useQuery<User>({
  queryKey: ["users", "user_1"],
  queryFn: () => api("users").get("user_1"),
});

const productsQuery = useQuery<ListResponse<Product>>({
  queryKey: ["products", "list"],
  queryFn: () => api("products").list(),
});

// Typed mutations
const createUserMutation = useMutation<User, Error, Partial<User>>({
  mutationFn: api("users").create,
});

// Type-safe filter building
const filter = useFilter();
filter.addCondition(null, {
  field: "status" as keyof User,
  operator: "EQUALS",
  value: "active",
});

// Direct usage (still supported)
const user: User = await api("users").get("user_1");
const products: ListResponse<Product> = await api("products").list();
```

## Performance Best Practices

### Debounced Filtering with React Query

```typescript
import { useDebouncedValue } from "@mantine/hooks"; // or your preferred debounce hook

function ProductList() {
  const filter = useFilter();
  const [debouncedFilter] = useDebouncedValue(filter.json, 300);

  const productsQuery = useQuery({
    queryKey: ["products", "filtered", debouncedFilter],
    queryFn: () => api("products").list({ filter: debouncedFilter }),
    enabled: !filter.isEmpty,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    keepPreviousData: true, // Show previous data while loading new data
  });

  return (
    <div>
      {productsQuery.isFetching && <div>Updating...</div>}
      {productsQuery.data?.data.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Pagination with React Query

```typescript
function UserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const filter = useFilter();
  const pageSize = 25;

  const usersQuery = useQuery({
    queryKey: ["users", "list", { page: currentPage, filter: filter.json }],
    queryFn: () =>
      api("users").list({
        filter: filter.json,
        pageNo: currentPage,
        pageSize,
      }),
    keepPreviousData: true, // Keep showing old data while loading new page
    staleTime: 5 * 60 * 1000, // Cache pages for 5 minutes
  });

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter.json]);

  const totalPages = usersQuery.data?.totalPages ?? 0;

  return (
    <div>
      {/* Filter UI */}

      {/* Loading state */}
      {usersQuery.isFetching && <div>Loading...</div>}

      {/* User list */}
      {usersQuery.data?.data.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}

      {/* Pagination controls */}
      <div>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || usersQuery.isFetching}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || usersQuery.isFetching}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Optimistic Updates

```typescript
function UserActions({ user }) {
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => api("users").update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users", id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(["users", id]);

      // Optimistically update
      queryClient.setQueryData(["users", id], (old) => ({ ...old, ...data }));

      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(["users", variables.id], context.previousUser);
      }
    },
    onSettled: (data, error, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["users", id] });
    },
  });

  return (
    <button
      onClick={() =>
        updateUserMutation.mutate({
          id: user.id,
          data: { status: "active" },
        })
      }
    >
      Activate User
    </button>
  );
}
```

### Query Key Management

```typescript
// Create consistent query key factories
const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
const usersQuery = useQuery({
  queryKey: userKeys.list(JSON.stringify(filter.json)),
  queryFn: () => api("users").list({ filter: filter.json }),
});

// Easy cache invalidation
queryClient.invalidateQueries({ queryKey: userKeys.lists() }); // Invalidate all user lists
queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) }); // Invalidate specific user
```
