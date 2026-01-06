# KF AI SDK - Implementation Guide

## Overview

The KF AI SDK provides a complete TypeScript/React SDK for building applications with Business Objects (BOs) that include sophisticated business rules, role-based access control, and optimized client-side validation.

## Key Features

### ✅ **Complete Rule System**

- **Validation Rules**: Client-side validation with expression trees
- **Computation Rules**: Server-side calculations with API updates
- **Business Logic Rules**: Complex server-side business logic
- **Automatic Rule Classification**: Smart execution strategy (client vs server)

### ✅ **Role-Based Access Control**

- **Field-Level Permissions**: Editable, readable, and hidden field control
- **Method Restrictions**: Role-based CRUD operation permissions
- **Data Filtering**: Automatic role-based data filtering
- **Type-Safe Access**: Compile-time enforcement of permissions

### ✅ **Optimized Performance**

- **Expression Caching**: LRU cache for computed values
- **Dependency Tracking**: Smart field watching and updates
- **Batch Operations**: Efficient bulk validations and updates
- **Short-Circuit Evaluation**: Optimized logical operations

### ✅ **Complete API Integration**

- **POST-Based APIs**: Correct implementation per BDO specification
- **Count Operations**: Efficient counting with same payload as list
- **Error Handling**: Comprehensive error management
- **Type Safety**: Full TypeScript coverage

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App Layer     │    │  Component      │    │   API Layer     │
│   (Business     │◄──►│  Hooks          │◄──►│  (HTTP Client)  │
│   Objects)      │    │  (useTable,     │    │                 │
│                 │    │   useForm)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Type System   │    │  Rule Engine    │    │  Expression     │
│   (Role-based   │    │  (Classification│    │  Evaluator      │
│   Views)        │    │  & Execution)   │    │  (Optimized)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Basic Table Usage

```typescript
import { useTable } from "kf-ai-sdk";

function ProductList() {
  const table = useTable<ProductType>({
    source: "BDO_AmazonProductMaster",
    columns: [
      { fieldId: "Title", enableSorting: true },
      { fieldId: "Price", enableSorting: true },
      { fieldId: "Stock", enableFiltering: true }
    ],
    enablePagination: true,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 }
    }
  });

  if (table.isLoading) return <div>Loading...</div>;

  return (
    <div>
      <input
        value={table.search.query}
        onChange={(e) => table.search.setQuery(e.target.value)}
        placeholder="Search products..."
      />

      <table>
        <thead>
          <tr>
            <th onClick={() => table.sort.toggle("Title")}>
              Title {table.sort.field === "Title" && table.sort.direction}
            </th>
            <th onClick={() => table.sort.toggle("Price")}>
              Price {table.sort.field === "Price" && table.sort.direction}
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((product) => (
            <tr key={product.ProductId}>
              <td>{product.Title}</td>
              <td>${product.Price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {table.pagination.totalPages > 1 && (
        <div>
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
        </div>
      )}
    </div>
  );
}
```

### 2. Form with Business Rules

```typescript
import { useForm } from "kf-ai-sdk";
import { AmazonProductMasterType } from "./types";

function ProductForm({ productId }: { productId?: string }) {
  const form = useForm<AmazonProductMasterType>({
    source: "BDO_AmazonProductMaster",
    operation: productId ? "update" : "create",
    recordId: productId,
    userRole: "Seller",

    // Handle computation rules (server-side calculations)
    onComputationRule: async (context) => {
      // Call update API for computation/business logic rules
      const response = await api(form.source).update(productId!, {
        [context.fieldName]: context.fieldValue
      });

      // Return computed field updates
      return response.computedFields || {};
    },

    onSuccess: (data) => {
      console.log("Product saved:", data);
    }
  });

  const handleSubmit = form.handleSubmit();

  if (form.isLoadingInitialData) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {/* ASIN Field with validation */}
      <div>
        <label htmlFor="asin">ASIN *</label>
        <input
          id="asin"
          {...form.register("ASIN")}
          disabled={!form.getField("ASIN")?.permission.editable}
        />
        {form.errors.ASIN && (
          <span className="error">{form.errors.ASIN.message}</span>
        )}
      </div>

      {/* Title Field */}
      <div>
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          {...form.register("Title")}
          disabled={!form.getField("Title")?.permission.editable}
        />
        {form.errors.Title && (
          <span className="error">{form.errors.Title.message}</span>
        )}
      </div>

      {/* Price Field - triggers discount calculation */}
      <div>
        <label htmlFor="price">Price *</label>
        <input
          id="price"
          type="number"
          step="0.01"
          {...form.register("Price")}
          disabled={!form.getField("Price")?.permission.editable}
        />
        {form.errors.Price && (
          <span className="error">{form.errors.Price.message}</span>
        )}
      </div>

      {/* MRP Field */}
      <div>
        <label htmlFor="mrp">MRP *</label>
        <input
          id="mrp"
          type="number"
          step="0.01"
          {...form.register("MRP")}
          disabled={!form.getField("MRP")?.permission.editable}
        />
        {form.errors.MRP && (
          <span className="error">{form.errors.MRP.message}</span>
        )}
      </div>

      {/* Computed Discount Field (read-only) */}
      <div>
        <label htmlFor="discount">Discount %</label>
        <input
          id="discount"
          type="number"
          {...form.register("Discount")}
          disabled={true} // Always disabled for computed fields
        />
      </div>

      {/* Category Dropdown */}
      <div>
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          {...form.register("Category")}
          disabled={!form.getField("Category")?.permission.editable}
        >
          <option value="">Select Category</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Clothing">Clothing</option>
          <option value="Home">Home & Kitchen</option>
          <option value="Sports">Sports & Outdoors</option>
          <option value="Toys">Toys & Games</option>
        </select>
        {form.errors.Category && (
          <span className="error">{form.errors.Category.message}</span>
        )}
      </div>

      <button
        type="submit"
        disabled={form.isSubmitting || !form.isValid}
      >
        {form.isSubmitting ? "Saving..." : "Save Product"}
      </button>

      {form.hasError && (
        <div className="error">
          {form.submitError?.message || "An error occurred"}
        </div>
      )}
    </form>
  );
}
```

### 3. Role-Based Business Object Access

```typescript
import { AmazonProductMaster, AmazonProducts } from "kf-ai-sdk";

// Admin - Full Access
const adminProducts = new AmazonProductMaster("Admin");
await adminProducts.create({
  ASIN: "B08N5WRWNW",
  SKU: "ECHO-DOT-4TH",
  Title: "Echo Dot (4th Gen)",
  Price: 49.99,
  MRP: 59.99,
  Cost: 25.0, // Admin can set cost
  Category: "Electronics",
});

// Seller - Limited Access
const sellerProducts = AmazonProducts.Seller();
await sellerProducts.update("PROD-2024-0001", {
  Price: 44.99, // Seller can update pricing
  // Cost: 30.00 // ❌ TypeScript error - sellers can't access cost
});

// Buyer - Read Only
const buyerProducts = AmazonProducts.Buyer();
const products = await buyerProducts.list(); // Only sees active products
// await buyerProducts.create({...}); // ❌ TypeScript error - buyers can't create
```

## Business Rules Implementation

### Validation Rules (Client-Side)

```typescript
// Automatic validation from BDO schema
const validationRules = {
  ASIN: [
    {
      Id: "RULE_ASIN_REQUIRED",
      Expression: "ASIN != null AND TRIM(ASIN) != ''",
      Message: "ASIN is required",
    },
    {
      Id: "RULE_ASIN_FORMAT",
      Expression: "LENGTH(ASIN) == 10 AND MATCHES(ASIN, '^[A-Z0-9]{10}$')",
      Message: "ASIN must be exactly 10 alphanumeric characters",
    },
  ],
};
```

### Computation Rules (Server-Side)

```typescript
// Triggered when Price or MRP changes
const computationRules = {
  RULE_CALC_DISCOUNT: {
    Expression: "IF(MRP > 0, ((MRP - Price) / MRP) * 100, 0)",
    // Automatically triggers API call to update computed fields
  },
};
```

### Business Logic Rules (Server-Side)

```typescript
// Complex business logic executed on server
const businessLogicRules = {
  RULE_INVENTORY_CHECK: {
    Expression: "Stock > 0 AND Warehouse != null",
    // Triggers inventory validation and updates
  },
};
```

## Advanced Features

### Custom Filters

```typescript
const table = useTable({
  source: "BDO_AmazonProductMaster",
  // ... other options
});

// Add complex filter
table.filter.addCondition({
  fieldName: "Price",
  operator: "BETWEEN",
  value: { min: 10, max: 100 },
});

// Add category filter
table.filter.addCondition({
  fieldName: "Category",
  operator: "IN",
  value: ["Electronics", "Books"],
});

// Set logical operator
table.filter.setLogicalOperator("AND");
```

### Bulk Operations

```typescript
const adminProducts = new AmazonProductMaster("Admin");

// Batch create
await adminProducts.batchCreate([
  { ASIN: "B001", Title: "Product 1" /*...*/ },
  { ASIN: "B002", Title: "Product 2" /*...*/ },
]);

// Batch update
await adminProducts.batchUpdate([
  { ProductId: "PROD-1", Price: 29.99 },
  { ProductId: "PROD-2", Price: 39.99 },
]);
```

### Performance Optimization

```typescript
// Expression caching automatically optimizes repeated evaluations
import { clearExpressionCache } from "kf-ai-sdk";

// Clear cache when needed (e.g., on user role change)
clearExpressionCache();
```

## Error Handling Strategies

### Form Errors

```typescript
const form = useForm({
  // ... options
  onError: (error) => {
    // Handle load errors
    toast.error(`Failed to load: ${error.message}`);
  },
  onSubmitError: (error) => {
    // Handle submission errors
    if (error.code === "VALIDATION_FAILED") {
      // Show field-specific errors
      error.fieldErrors.forEach(({ field, message }) => {
        toast.error(`${field}: ${message}`);
      });
    } else {
      toast.error(`Save failed: ${error.message}`);
    }
  },
});
```

### API Errors

```typescript
try {
  await products.create(productData);
} catch (error) {
  if (error.code === "PERMISSION_DENIED") {
    toast.error("You don't have permission to create products");
  } else if (error.code === "VALIDATION_FAILED") {
    toast.error("Please check your input and try again");
  } else {
    toast.error("An unexpected error occurred");
  }
}
```

## Best Practices

### 1. Use TypeScript Strictly

```typescript
// ✅ Good - Type-safe access
const products = new AmazonProductMaster<"Seller">("Seller");
const product: SellerAmazonProduct = await products.get("PROD-001");

// ❌ Bad - Losing type safety
const products = new AmazonProductMaster("Seller" as any);
```

### 2. Leverage Role-Based Views

```typescript
// ✅ Good - Use specific role clients
const buyerProducts = AmazonProducts.Buyer();
const sellerProducts = AmazonProducts.Seller();

// ❌ Bad - Generic admin access everywhere
const adminProducts = new AmazonProductMaster("Admin");
```

### 3. Handle Async Operations Properly

```typescript
// ✅ Good - Proper error handling
const form = useForm({
  onComputationRule: async (context) => {
    try {
      const result = await api(context.source).update(id, data);
      return result.computedFields;
    } catch (error) {
      console.error("Computation failed:", error);
      throw error; // Re-throw to trigger form error handling
    }
  },
});

// ❌ Bad - Swallowing errors
const form = useForm({
  onComputationRule: async (context) => {
    try {
      return await api(context.source).update(id, data);
    } catch (error) {
      return {}; // Silent failure
    }
  },
});
```

### 4. Optimize Performance

```typescript
// ✅ Good - Use dependency tracking
const form = useForm({
  source: "BDO_AmazonProductMaster",
  // Dependencies automatically tracked and optimized
});

// ✅ Good - Batch operations when possible
const updates = products.map((p) => ({ id: p.id, price: p.price * 1.1 }));
await adminProducts.batchUpdate(updates);
```

## Migration Guide

### From Legacy Forms to New useForm

**Before:**

```typescript
const form = useForm({
  source: "product",
  // All rules triggered API calls
});
```

**After:**

```typescript
const form = useForm({
  source: "BDO_AmazonProductMaster",
  userRole: "Seller",
  // Validation rules run client-side
  // Computation rules trigger API calls
  onComputationRule: async (context) => {
    const result = await api(context.source).update(id, {
      [context.fieldName]: context.fieldValue,
    });
    return result.computedFields;
  },
});
```

### API Endpoint Updates

**Before:**

```typescript
// GET requests
const products = await fetch(`/api/product/list`);
```

**After:**

```typescript
// POST requests with payload
const products = await api("BDO_AmazonProductMaster").list({
  Sort: [{ Title: "ASC" }],
  PageSize: 10,
});
```

## Troubleshooting

### Common Issues

1. **ValidationRule Type Mismatch**

   ```typescript
   // Fix: Update ValidationRule interface
   // Old: rule.Condition.ExpressionTree
   // New: rule.ExpressionTree
   ```

2. **Permission Denied Errors**

   ```typescript
   // Fix: Check role permissions in BDO schema
   const field = form.getField("Cost");
   if (!field.permission.editable) {
     // Field is read-only for current role
   }
   ```

3. **Expression Evaluation Errors**
   ```typescript
   // Fix: Clear cache and check expression syntax
   import { clearExpressionCache } from "kf-ai-sdk";
   clearExpressionCache();
   ```

### Debug Mode

```typescript
// Enable debug logging
const table = useTable({
  source: "BDO_AmazonProductMaster",
  onError: (error) => {
    console.debug("Table error:", error);
  },
});

const form = useForm({
  source: "BDO_AmazonProductMaster",
  onSchemaError: (error) => {
    console.debug("Schema error:", error);
  },
});
```

## Next Steps

1. **Implement Custom Business Objects**: Follow the Amazon Product Master pattern
2. **Add Advanced Filtering**: Implement complex filter UIs
3. **Optimize for Mobile**: Add responsive design considerations
4. **Add Offline Support**: Implement local caching and sync
5. **Enhance Security**: Add field-level encryption for sensitive data

For more examples and detailed API documentation, see the `/examples` directory.
