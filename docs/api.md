# API

Direct API methods for CRUD operations, drafts, metrics, and metadata.

## Setup

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);
```

---

## Type Definitions

### ListOptionsType

```typescript
// Options for listing records with pagination, filtering, and sorting
interface ListOptionsType {
  // Specific fields to return (omit for all fields)
  Field?: string[];

  // Filter criteria (see useFilter docs)
  Filter?: FilterType;

  // Sort configuration
  // Format: [{ "fieldName": "ASC" }] or [{ "fieldName": "DESC" }]
  Sort?: SortType;

  // Full-text search query
  Search?: string;

  // Page number (1-indexed, default: 1)
  Page?: number;

  // Records per page (default: 10)
  PageSize?: number;
}
```

### ListResponseType

```typescript
// Response from list operation
interface ListResponseType<T> {
  // Array of records for current page
  Data: T[];
}
```

### CreateUpdateResponseType

```typescript
// Response from create or update operations
interface CreateUpdateResponseType {
  // ID of the created or updated record
  _id: string;
}
```

### DeleteResponseType

```typescript
// Response from delete operation
interface DeleteResponseType {
  // Always "success" on successful deletion
  status: "success";
}
```

### DraftResponseType

```typescript
// Response from draft operations
// Contains computed field values returned by server
interface DraftResponseType {
  // Keys are field names, values are computed results
  [fieldName: string]: any;
}
```

### MetricFieldType

```typescript
// Definition for a single metric aggregation
interface MetricFieldType {
  // Field to aggregate
  Field: string;

  // Aggregation function
  // Sum | Avg | Count | Max | Min | DistinctCount | BlankCount | NotBlankCount | Concat | DistinctConcat
  Type: MetricTypeType;
}
```

### MetricOptionsType

```typescript
// Options for metric aggregation queries
interface MetricOptionsType {
  // Fields to group by (empty array for totals)
  GroupBy: string[];

  // Metric definitions
  Metric: MetricFieldType[];

  // Optional filter criteria
  Filter?: FilterType;
}
```

### MetricResponseType

```typescript
// Response from metric aggregation
interface MetricResponseType {
  // Aggregated data rows
  // Keys follow pattern: {type}_{Field} (e.g., "count__id", "sum_Stock", "avg_Price")
  Data: Record<string, any>[];
}
```

### PivotOptionsType

```typescript
// Options for pivot table queries
interface PivotOptionsType {
  // Row dimension fields
  Row: string[];

  // Column dimension fields
  Column: string[];

  // Metric definitions
  Metric: MetricFieldType[];

  // Optional filter criteria
  Filter?: FilterType;
}
```

### PivotHeaderItemType

```typescript
// Header item in pivot response
interface PivotHeaderItemType {
  // Header label
  Label: string;

  // Nested child headers (for hierarchical dimensions)
  Children?: PivotHeaderItemType[];
}
```

### PivotResponseType

```typescript
// Response from pivot table query
interface PivotResponseType {
  Data: {
    // Row headers (hierarchical)
    RowHeader: PivotHeaderItemType[];

    // Column headers (hierarchical)
    ColumnHeader: PivotHeaderItemType[];

    // Value matrix [row][column]
    Value: (number | string | null)[][];
  };
}
```

### FieldsResponseType

```typescript
// Response from fields metadata query
interface FieldsResponseType {
  // Field metadata array
  Data: Record<string, any>[];
}
```

---

## Methods

### list

Fetches paginated records with optional filtering, sorting, and search.

```typescript
const response = await product.list(options?: ListOptionsType): Promise<ListResponseType<T>>
```

**Example:** Fetch paginated products with filter

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.list({
  Field: ["Title", "Price", "Category"],
  Filter: {
    Operator: "And",
    Condition: [
      {
        LHSField: "Category",
        Operator: "EQ",
        RHSValue: "Electronics",
        RHSType: "Constant",
      },
    ],
  },
  Sort: [{ Price: "ASC" }],
  Page: 1,
  PageSize: 20,
});

// response.Data contains array of products
response.Data.forEach((item) => {
  console.log(item.Title, item.Price);
});
```

---

### get

Fetches a single record by ID.

```typescript
const record = await product.get(id: string): Promise<T>
```

**Example:** Fetch single product

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const item = await product.get("prod_abc123");

console.log(item.Title);
console.log(item.Price);
console.log(item.Description);
```

---

### create

Creates a new record.

```typescript
const response = await product.create(data: Partial<T>): Promise<CreateUpdateResponseType>
```

**Example:** Create new product

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.create({
  Title: "Wireless Headphones",
  Price: 99.99,
  Category: "Electronics",
  Stock: 50,
  Description: "High-quality wireless headphones with noise cancellation",
});

console.log("Created product with ID:", response._id);
```

---

### update

Updates an existing record.

```typescript
const response = await product.update(id: string, data: Partial<T>): Promise<CreateUpdateResponseType>
```

**Example:** Update product price

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.update("prod_abc123", {
  Price: 79.99,
  Stock: 45,
});

console.log("Updated product:", response._id);
```

---

### delete

Deletes a record by ID.

```typescript
const response = await product.delete(id: string): Promise<DeleteResponseType>
```

**Example:** Delete product

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.delete("prod_abc123");

if (response.status === "success") {
  console.log("Product deleted successfully");
}
```

---

### draft

Previews computed field values for a new record without saving.

```typescript
const response = await product.draft(data: Partial<T>): Promise<DraftResponseType>
```

**Example:** Preview computed discount

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const draftResponse = await product.draft({
  Price: 100,
  DiscountPercent: 15,
});

// Server computes and returns calculated fields
console.log("Computed discount amount:", draftResponse.DiscountAmount);
console.log("Computed final price:", draftResponse.FinalPrice);
```

---

### draftPatch

Previews computed field values for an existing record being edited.

```typescript
const response = await product.draftPatch(id: string, data: Partial<T>): Promise<DraftResponseType>
```

**Example:** Update draft during editing

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const draftResponse = await product.draftPatch("prod_abc123", {
  Price: 120,
  DiscountPercent: 20,
});

// Server computes updated calculated fields
console.log("Updated discount amount:", draftResponse.DiscountAmount);
console.log("Updated final price:", draftResponse.FinalPrice);
```

---

### metric

Performs aggregation queries on records.

```typescript
const response = await product.metric(options: MetricOptionsType): Promise<MetricResponseType>
```

**Example 1:** Total count

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.metric({
  GroupBy: [],
  Metric: [{ Field: "_id", Type: "Count" }],
});

// Response: { Data: [{ "count__id": 150 }] }
console.log("Total products:", response.Data[0]["count__id"]);
```

**Example 2:** Sum with filter (low stock count)

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.metric({
  GroupBy: [],
  Metric: [{ Field: "_id", Type: "Count" }],
  Filter: {
    Operator: "And",
    Condition: [
      {
        LHSField: "Stock",
        Operator: "LT",
        RHSValue: 10,
        RHSType: "Constant",
      },
    ],
  },
});

// Response: { Data: [{ "count__id": 12 }] }
console.log("Low stock products:", response.Data[0]["count__id"]);
```

**Example 3:** Group by field (products by category)

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.metric({
  GroupBy: ["Category"],
  Metric: [{ Field: "_id", Type: "Count" }],
});

// Response: { Data: [
//   { "Category": "Electronics", "count__id": 45 },
//   { "Category": "Books", "count__id": 30 },
//   { "Category": "Clothing", "count__id": 25 }
// ] }
response.Data.forEach((row) => {
  console.log(`${row.Category}: ${row["count__id"]} products`);
});
```

**Example 4:** Multiple metrics (stock sum and average by category)

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.metric({
  GroupBy: ["Category"],
  Metric: [
    { Field: "Stock", Type: "Sum" },
    { Field: "Price", Type: "Avg" },
  ],
});

// Response: { Data: [
//   { "Category": "Electronics", "sum_Stock": 500, "avg_Price": 299.99 },
//   { "Category": "Books", "sum_Stock": 1200, "avg_Price": 24.99 }
// ] }
response.Data.forEach((row) => {
  console.log(
    `${row.Category}: ${row["sum_Stock"]} total stock, $${row["avg_Price"]} avg price`,
  );
});
```

---

### pivot

Creates pivot table aggregations with row and column dimensions.

```typescript
const response = await product.pivot(options: PivotOptionsType): Promise<PivotResponseType>
```

**Example:** Sales pivot by region and quarter

```typescript
import { Order } from "../sources";
import type { OrderForRole } from "../sources";
import { Roles } from "../sources/roles";

type AdminOrder = OrderForRole<typeof Roles.Admin>;

const order = new Order(Roles.Admin);

const response = await order.pivot({
  Row: ["Region"],
  Column: ["Quarter"],
  Metric: [{ Field: "Amount", Type: "Sum" }],
});

// Response structure:
// {
//   Data: {
//     RowHeader: [
//       { Label: "North" },
//       { Label: "South" },
//       { Label: "East" },
//       { Label: "West" }
//     ],
//     ColumnHeader: [
//       { Label: "Q1" },
//       { Label: "Q2" },
//       { Label: "Q3" },
//       { Label: "Q4" }
//     ],
//     Value: [
//       [10000, 12000, 15000, 18000],  // North
//       [8000, 9500, 11000, 13000],    // South
//       [7500, 8000, 9000, 10500],     // East
//       [6000, 7000, 8500, 9000]       // West
//     ]
//   }
// }

const { RowHeader, ColumnHeader, Value } = response.Data;

RowHeader.forEach((row, rowIndex) => {
  ColumnHeader.forEach((col, colIndex) => {
    console.log(`${row.Label} - ${col.Label}: $${Value[rowIndex][colIndex]}`);
  });
});
```

---

### fields

Fetches field metadata for the source.

```typescript
const response = await product.fields(): Promise<FieldsResponseType>
```

**Example:** Get field metadata

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

const response = await product.fields();

// response.Data contains array of field metadata objects
response.Data.forEach((field) => {
  console.log(`Field: ${field.Name}, Type: ${field.Type}`);
});
```

---

### fetchField

Fetches options for reference or static fields (used for dropdowns).

```typescript
const options = await product.fetchField(instanceId: string, fieldId: keyof T): Promise<T[] | StaticOptionType[]>
```

**Parameters:**

- `instanceId: string` - Record ID or draft ID
- `fieldId: keyof T` - Field name

**Response:** Depends on field type:

- **Reference fields:** Returns `T[]` (full referenced records)
- **Static fields:** Returns `{ Value: string; Label: string }[]`

**Example:** Fetch supplier options for dropdown

```typescript
import { Product } from "../sources";
import type { ProductForRole } from "../sources";
import { Roles } from "../sources/roles";

type BuyerProduct = ProductForRole<typeof Roles.Buyer>;

const product = new Product(Roles.Buyer);

// For a new record, use empty string or draft ID
const suppliers = await product.fetchField("", "Supplier");

// For reference fields, returns full records
suppliers.forEach((supplier) => {
  console.log(`${supplier._id}: ${supplier.Name}`);
});

// For static fields, returns value/label pairs
const statuses = await product.fetchField("prod_abc123", "Status");
statuses.forEach((option) => {
  console.log(`${option.Value}: ${option.Label}`);
});
```
