# KF AI SDK - Quick Reference

## 🚀 Installation & Setup

```bash
npm install kf-ai-sdk
```

```typescript
import { setApiBaseUrl } from "kf-ai-sdk";

// Configure API base URL (without /api/app - SDK adds proper paths automatically)
setApiBaseUrl("https://api.your-domain.com");
```

## 📊 useTable Hook

### Basic Usage

```typescript
const table = useTable<ProductType>({
  source: "BDO_AmazonProductMaster",
  columns: [
    { fieldId: "Title", enableSorting: true },
    { fieldId: "Price", enableSorting: true, enableFiltering: true },
  ],
});
```

### Key Properties

| Property              | Type                       | Description        |
| --------------------- | -------------------------- | ------------------ |
| `rows`                | `T[]`                      | Current table data |
| `isLoading`           | `boolean`                  | Loading state      |
| `totalItems`          | `number`                   | Total count        |
| `search.query`        | `string`                   | Current search     |
| `search.setQuery`     | `(query: string) => void`  | Update search      |
| `sort.toggle`         | `(field: keyof T) => void` | Toggle sort        |
| `pagination.goToNext` | `() => void`               | Next page          |
| `filter.addCondition` | `(condition) => string`    | Add filter         |

## 📝 useForm Hook

### Basic Usage

```typescript
const form = useForm<ProductType>({
  source: "BDO_AmazonProductMaster",
  operation: "create", // or "update"
  userRole: "Seller",
  onComputationRule: async (context) => {
    // Handle server-side computation rules
    const result = await api(context.source).update(id, data);
    return result.computedFields;
  },
});
```

### Key Properties

| Property       | Type                                 | Description    |
| -------------- | ------------------------------------ | -------------- |
| `register`     | `(name, options?) => RegisterReturn` | Register field |
| `handleSubmit` | `() => (e?) => Promise<void>`        | Submit handler |
| `errors`       | `FieldErrors<T>`                     | Form errors    |
| `isValid`      | `boolean`                            | Form validity  |
| `isSubmitting` | `boolean`                            | Submit state   |
| `getField`     | `(fieldName) => ProcessedField`      | Field metadata |

### Field Permissions

```typescript
const field = form.getField("Price");
if (field.permission.editable) {
  // Field is editable for current role
}
if (field.permission.hidden) {
  // Field should not be displayed
}
```

## 🏢 Business Object Classes

### Role-Based Access

```typescript
// Admin - Full access
const adminProducts = new AmazonProductMaster("Admin");

// Seller - Limited access
const sellerProducts = new AmazonProductMaster("Seller");

// Buyer - Read-only
const buyerProducts = new AmazonProductMaster("Buyer");
```

### CRUD Operations

```typescript
// Create
const result = await products.create({
  ASIN: "B08N5WRWNW",
  Title: "Product Name",
  Price: 49.99,
});

// Read
const product = await products.get("PROD-001");

// Update
await products.update("PROD-001", { Price: 44.99 });

// Delete (Admin only)
await products.delete("PROD-001");

// List with options
const list = await products.list({
  Sort: [{ Price: "DESC" }],
  PageSize: 20,
  Filter: {
    Operator: "AND",
    Condition: [
      { LhsField: "Category", Operator: "EQ", RhsValue: "Electronics" },
    ],
  },
});
```

## ⚡ Performance Optimizations

### Expression Caching

```typescript
import { clearExpressionCache } from "kf-ai-sdk";

// Clear cache when role changes
clearExpressionCache();
```

### Dependency Tracking

```typescript
// Automatically optimized - only watches relevant fields
const form = useForm({
  source: "BDO_AmazonProductMaster",
  // Price changes will only trigger discount recalculation
});
```

## 🔧 Rule Types

| Rule Type          | Execution   | Purpose           | Example             |
| ------------------ | ----------- | ----------------- | ------------------- |
| **Validation**     | Client-side | Field validation  | ASIN format check   |
| **Computation**    | Server-side | Calculated fields | Discount percentage |
| **Business Logic** | Server-side | Complex logic     | Inventory updates   |

### Rule Implementation

```typescript
// Client-side validation (automatic)
"LENGTH(ASIN) == 10 AND MATCHES(ASIN, '^[A-Z0-9]{10}$')";

// Server-side computation (triggers API call)
"IF(MRP > 0, ((MRP - Price) / MRP) * 100, 0)";
```

## 🛡️ Error Handling

### Form Errors

```typescript
const form = useForm({
  onError: (error) => toast.error(error.message),
  onSubmitError: (error) => {
    if (error.code === "VALIDATION_FAILED") {
      // Handle validation errors
    }
  },
});
```

### API Errors

```typescript
try {
  await products.create(data);
} catch (error) {
  switch (error.code) {
    case "PERMISSION_DENIED":
      // Handle permission error
      break;
    case "VALIDATION_FAILED":
      // Handle validation error
      break;
    default:
    // Handle other errors
  }
}
```

## 📋 Filter Conditions

### Basic Filters

```typescript
table.filter.addCondition({
  fieldName: "Price",
  operator: "GT",
  value: 50,
});
```

### Complex Filters

```typescript
table.filter.addCondition({
  fieldName: "Category",
  operator: "IN",
  value: ["Electronics", "Books"],
});

table.filter.addCondition({
  fieldName: "Price",
  operator: "BETWEEN",
  value: { min: 10, max: 100 },
});

table.filter.setLogicalOperator("AND");
```

## 📊 Sorting & Pagination

### Sorting

```typescript
// Toggle sort on click
<th onClick={() => table.sort.toggle("Title")}>
  Title {table.sort.field === "Title" && table.sort.direction}
</th>
```

### Pagination

```typescript
<button
  disabled={!table.pagination.canGoPrevious}
  onClick={table.pagination.goToPrevious}
>
  Previous
</button>

<span>
  Page {table.pagination.currentPage} of {table.pagination.totalPages}
</span>

<button
  disabled={!table.pagination.canGoNext}
  onClick={table.pagination.goToNext}
>
  Next
</button>
```

## 🔒 Permission Checks

### Role-Based Field Access

```typescript
// Check if field is editable
const canEdit = form.getField("Cost")?.permission.editable;

// Conditional rendering based on permissions
{form.getField("Cost")?.permission.readable && (
  <input {...form.register("Cost")} disabled={!canEdit} />
)}
```

### Method Permissions

```typescript
// TypeScript enforces this at compile time
const buyerProducts = AmazonProducts.Buyer();
// buyerProducts.create() // ❌ Compile error
// buyerProducts.delete() // ❌ Compile error
const products = await buyerProducts.list(); // ✅ OK
```

## 🎯 Common Patterns

### Search with Debouncing

```typescript
const [search, setSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    table.search.setQuery(search);
  }, 300);

  return () => clearTimeout(timer);
}, [search, table.search]);

<input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search..."
/>
```

### Dynamic Field Rendering

```typescript
const fields = form.getFields();

{Object.entries(fields).map(([fieldName, field]) => {
  if (field.permission.hidden) return null;

  return (
    <div key={fieldName}>
      <label>{field.label}</label>
      <input
        {...form.register(fieldName)}
        disabled={!field.permission.editable}
        type={field.type}
      />
    </div>
  );
})}
```

### Conditional Business Logic

```typescript
const form = useForm({
  onComputationRule: async (context) => {
    switch (context.ruleType) {
      case "Computation":
        // Handle computation rules
        return await calculateFields(context);
      case "BusinessLogic":
        // Handle business logic rules
        return await executeBusinessLogic(context);
    }
  },
});
```

## 📦 Type Definitions

### Common Types

```typescript
import type {
  ListOptions,
  ListResponse,
  CreateUpdateResponse,
  UseTableReturn,
  UseFormReturn,
  ValidationRule,
  RolePermission,
} from "kf-ai-sdk";
```

### Business Object Types

```typescript
import type {
  AmazonProductMasterType,
  AdminAmazonProduct,
  SellerAmazonProduct,
  BuyerAmazonProduct,
} from "kf-ai-sdk";
```

## 🐛 Debugging Tips

### Debug Table Issues

```typescript
console.log("Table state:", {
  isLoading: table.isLoading,
  totalItems: table.totalItems,
  currentPage: table.pagination.currentPage,
  filters: table.filter.conditions,
  sort: { field: table.sort.field, direction: table.sort.direction },
});
```

### Debug Form Issues

```typescript
console.log("Form state:", {
  isValid: form.isValid,
  errors: form.errors,
  values: form.watch(),
  schema: form.processedSchema,
});
```

### Debug API Issues

```typescript
import { getApiBaseUrl, getDefaultHeaders } from "kf-ai-sdk";

console.log("API Config:", {
  baseUrl: getApiBaseUrl(),
  headers: getDefaultHeaders(),
});
```

## ⚙️ Configuration

### API Setup

```typescript
import { setApiBaseUrl, setDefaultHeaders } from "kf-ai-sdk";

// Set base URL - SDK automatically appends /api/app/{bo_id} paths
setApiBaseUrl("https://api.example.com");
setDefaultHeaders({
  Authorization: `Bearer ${token}`,
  "X-API-Version": "1.0",
});
```

### React Query Setup

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000     // 10 minutes
    }
  }
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

---

## 🔗 Quick Links

- [Full Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Examples Directory](./examples/)
- [API Documentation](./api-docs/)
- [Business Object Schemas](./schemas/)
