# Runtime API Client - Business Object CRUD Operations

The Runtime API Client provides a comprehensive interface for Business Object CRUD operations, fully compatible with the Runtime API specification. It handles complex filtering, structured sorting, automatic datetime encoding/decoding, and proper request/response formatting.

## Overview

The API client provides 5 core methods for Business Object operations:

- `get(id)` - Retrieve a single Business Object instance
- `create(data)` - Create a new Business Object instance  
- `update(id, data)` - Update an existing Business Object instance
- `delete(id)` - Delete a Business Object instance
- `list(options)` - List Business Object instances with advanced filtering and sorting

## Basic Usage

```tsx
import { api } from "@kf-ai-sdk/api";

// Business Object operations
const user = await api("user").get("USER_123");
const users = await api("user").list();
const createResponse = await api("user").create({ 
  username: "john.doe", 
  email: "john@example.com" 
});
const updateResponse = await api("user").update("USER_123", { 
  email: "newemail@example.com" 
});
const deleteResponse = await api("user").delete("USER_123");
```

## Methods

### get(id)

Retrieve a single Business Object instance by ID.

```tsx
const user = await api("user").get("USER_123");
const leave = await api("leave").get("LEAVE_001");
```

**API Endpoint:** `GET /api/app/{bo_id}/{instance_id}/read`

**Parameters:**
- `id: string` - The unique identifier for the Business Object instance

**Returns:** `Promise<T>` - The requested record with decoded datetime fields

**Response Format:**
```tsx
// API returns: { "Data": { ...record } }
// Client returns: { ...record } with decoded datetimes
```

### create(data)

Create a new Business Object instance.

```tsx
// Create with auto-generated ID
const response = await api("leave").create({
  start_date: "2025-07-01",
  end_date: "2025-07-05",
  leave_type: "Sick",
  leave_days: 5,
  reason: "Medical leave"
});
console.log(response._id); // "LEAVE_1001"

// Create with custom ID
const response = await api("user").create({
  _id: "USER_456",
  username: "jane.doe",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane@example.com"
});
console.log(response._id); // "USER_456"

// Create with workflow initiation
const response = await api("leave").create({
  start_date: "2025-06-15",
  end_date: "2025-06-18",
  leave_type: "Annual",
  leave_status: "INITIATE" // Triggers workflow
});
```

**API Endpoint:** `POST /api/app/{bo_id}/create`

**Parameters:**
- `data: Partial<T> & { _id?: string }` - The data for the new record, optionally including custom ID

**Returns:** `Promise<CreateUpdateResponse>` - Object containing the ID of created record

```tsx
interface CreateUpdateResponse {
  _id: string;
}
```

### update(id, data)

Update an existing Business Object instance (partial updates supported).

```tsx
// Simple field update
const response = await api("leave").update("LEAVE_001", {
  leave_days: 7,
  reason: "Extended medical leave"
});

// Workflow state transition
const response = await api("leave").update("LEAVE_001", {
  leave_status: "MANAGER_APPROVAL",
  manager_remarks: "Approved by manager"
});

// Partial update
const response = await api("vendor").update("VEND_1001", {
  phone: "+1-555-9999",
  email: "newemail@vendor.com"
});
```

**API Endpoint:** `POST /api/app/{bo_id}/{instance_id}/update`

**Parameters:**
- `id: string` - The unique identifier for the record
- `data: Partial<T>` - The fields to update (only include fields you want to change)

**Returns:** `Promise<CreateUpdateResponse>` - Object containing the ID of updated record

### delete(id)

Delete a Business Object instance.

```tsx
const response = await api("leave").delete("LEAVE_001");
console.log(response.status); // "success"

const response = await api("user").delete("USER_123");
console.log(response.status); // "success"
```

**API Endpoint:** `DELETE /api/app/{bo_id}/{instance_id}/delete`

**Parameters:**
- `id: string` - The unique identifier for the record

**Returns:** `Promise<DeleteResponse>` - Success confirmation

```tsx
interface DeleteResponse {
  status: "success";
}
```

### list(options)

List Business Object instances with advanced filtering, sorting, and pagination.

```tsx
// Basic listing
const users = await api("user").list();

// With structured filtering
const activeUsers = await api("user").list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "status",
        RHSValue: "Active"
      }
    ]
  }
});

// With complex filtering and sorting
const results = await api("leave").list({
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "leave_type",
        RHSValue: "Annual"
      },
      {
        Operator: "GTE",
        LHSField: "leave_days",
        RHSValue: 3
      }
    ]
  },
  Sort: [
    { Field: "start_date", Order: "DESC" },
    { Field: "leave_days", Order: "ASC" }
  ],
  Page: 1,
  PageSize: 50
});

// With specific fields only
const userSummary = await api("user").list({
  Field: ["_id", "username", "email", "first_name", "last_name"],
  Page: 1,
  PageSize: 10
});
```

**API Endpoint:** `POST /api/app/{bo_id}/list`

**Parameters:**
- `options?: ListOptions` - Optional configuration object

```tsx
interface ListOptions {
  Type?: "List" | "Aggregation" | "Pivot";  // Query type (defaults to "List")
  Field?: string[];                         // Specific fields to return
  Filter?: Filter;                          // Filter criteria
  Sort?: Sort[];                           // Sort configuration
  Page?: number;                           // Page number (1-indexed)
  PageSize?: number;                       // Records per page
}
```

**Returns:** `Promise<ListResponse<T>>` - Array of records with decoded datetimes

```tsx
interface ListResponse<T> {
  Data: T[];  // Array of records
}
```

## Advanced Filtering

The API client supports complex filtering with nested conditions:

### Filter Operators

```tsx
// Comparison operators
"EQ"         // Equal
"NE"         // Not Equal  
"GT"         // Greater Than
"GTE"        // Greater Than or Equal
"LT"         // Less Than
"LTE"        // Less Than or Equal
"Between"    // Value in range (inclusive)
"NotBetween" // Value outside range

// List operators
"IN"         // Value in list
"NIN"        // Value not in list

// Null/Empty operators
"Empty"      // Field is null or empty
"NotEmpty"   // Field has a value

// String operators
"Contains"     // String contains substring
"NotContains"  // String doesn't contain
"MinLength"    // Minimum string length
"MaxLength"    // Maximum string length

// Logical operators
"AND"        // All conditions must be true
"OR"         // Any condition must be true
```

### Filter Examples

```tsx
// Simple equality
{
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "status",
        RHSValue: "Active"
      }
    ]
  }
}

// Range query
{
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "Between",
        LHSField: "leave_days",
        RHSValue: [3, 7]
      }
    ]
  }
}

// Multiple conditions with OR
{
  Filter: {
    Operator: "OR",
    Condition: [
      {
        Operator: "EQ",
        LHSField: "leave_type",
        RHSValue: "Sick"
      },
      {
        Operator: "EQ",
        LHSField: "leave_type",
        RHSValue: "Emergency"
      }
    ]
  }
}

// Nested AND/OR conditions
{
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "GTE",
        LHSField: "leave_days",
        RHSValue: 3
      },
      {
        Operator: "OR",
        Condition: [
          {
            Operator: "EQ",
            LHSField: "leave_type",
            RHSValue: "Annual"
          },
          {
            Operator: "EQ",
            LHSField: "leave_type",
            RHSValue: "Sick"
          }
        ]
      }
    ]
  }
}

// String operations
{
  Filter: {
    Operator: "AND",
    Condition: [
      {
        Operator: "Contains",
        LHSField: "reason",
        RHSValue: "vacation"
      },
      {
        Operator: "NotEmpty",
        LHSField: "manager_remarks"
      }
    ]
  }
}
```

## Sorting

```tsx
// Single field sort
Sort: [
  { Field: "start_date", Order: "DESC" }
]

// Multi-field sort
Sort: [
  { Field: "leave_type", Order: "ASC" },
  { Field: "start_date", Order: "DESC" },
  { Field: "leave_days", Order: "ASC" }
]
```

## DateTime Handling

The API client automatically handles datetime encoding and decoding:

### API DateTime Formats

```tsx
// DateTime format (with milliseconds)
{
  "$__dt__": 1741668010.123456
}

// Date format (YYYY-MM-DD)
{
  "$__d__": "2025-03-11"
}
```

### Utility Functions

```tsx
import { encodeDatetime, decodeDatetime, encodeDate, decodeDate } from "@kf-ai-sdk/api";

// Encoding (for custom requests)
const apiDateTime = encodeDatetime(new Date());  // { $__dt__: 1741668010.123456 }
const apiDate = encodeDate(new Date());          // { $__d__: "2025-03-11" }

// Decoding (automatic in responses)
const jsDate = decodeDatetime({ $__dt__: 1741668010.123456 });
const jsDate2 = decodeDate({ $__d__: "2025-03-11" });
```

## TypeScript Support

The API client provides full TypeScript support with proper typing:

```tsx
interface User {
  _id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  _created_at: Date;  // Automatically decoded from API format
  _modified_at: Date; // Automatically decoded from API format
}

interface Leave {
  _id: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  leave_days: number;
  reason: string;
  leave_status?: string;
  manager_remarks?: string;
  _created_at: Date;
  _modified_at: Date;
}

// Typed operations
const user: User = await api("user").get("USER_123");
const users: ListResponse<User> = await api("user").list();
const createResponse: CreateUpdateResponse = await api("user").create({
  username: "john.doe",
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com"
});
```

## Error Handling

All API operations return promises that handle API-specific errors:

```tsx
try {
  const user = await api("user").get("USER_123");
  console.log("User found:", user);
} catch (error) {
  console.error("Failed to get user:", error.message);
  // Error messages include API status and details
}

try {
  const response = await api("leave").create({
    start_date: "2025-07-01",
    // Missing required fields
  });
} catch (error) {
  console.error("Creation failed:", error.message);
  // API will return specific validation errors
}

try {
  const response = await api("leave").update("LEAVE_001", {
    leave_status: "INVALID_STATUS"
  });
} catch (error) {
  console.error("Update failed:", error.message);
  // API may return workflow transition errors
}
```

## Configuration

### Base URL

Configure the base URL for all API requests:

```tsx
import { setApiBaseUrl } from "@kf-ai-sdk/api";

// Default: http://localhost:3000/api/app
setApiBaseUrl("https://api.example.com/api/app");
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

## Complete Example

```tsx
import { api } from "@kf-ai-sdk/api";

class LeaveManagementService {
  // Get single leave request
  async getLeaveRequest(id: string) {
    return api("leave").get(id);
  }
  
  // Create leave request with workflow
  async createLeaveRequest(data: {
    start_date: string;
    end_date: string;
    leave_type: string;
    leave_days: number;
    reason: string;
  }) {
    return api("leave").create({
      ...data,
      leave_status: "INITIATE" // Start workflow
    });
  }
  
  // Approve leave request (manager action)
  async approveLeaveRequest(id: string, remarks: string) {
    return api("leave").update(id, {
      leave_status: "MANAGER_APPROVAL",
      manager_remarks: remarks
    });
  }
  
  // Get pending approvals for manager
  async getPendingApprovals() {
    return api("leave").list({
      Filter: {
        Operator: "AND",
        Condition: [
          {
            Operator: "EQ",
            LHSField: "leave_status",
            RHSValue: "MANAGER_APPROVAL"
          }
        ]
      },
      Sort: [
        { Field: "start_date", Order: "ASC" }
      ]
    });
  }
  
  // Get leave history for user
  async getUserLeaveHistory(userId: string) {
    return api("leave").list({
      Filter: {
        Operator: "AND",
        Condition: [
          {
            Operator: "EQ",
            LHSField: "_created_by",
            RHSValue: userId
          }
        ]
      },
      Sort: [
        { Field: "start_date", Order: "DESC" }
      ],
      PageSize: 50
    });
  }
  
  // Search leaves by type and date range
  async searchLeaves(leaveType: string, startDate: string, endDate: string) {
    return api("leave").list({
      Filter: {
        Operator: "AND",
        Condition: [
          {
            Operator: "EQ",
            LHSField: "leave_type",
            RHSValue: leaveType
          },
          {
            Operator: "Between",
            LHSField: "start_date",
            RHSValue: [startDate, endDate]
          }
        ]
      },
      Sort: [
        { Field: "start_date", Order: "ASC" }
      ]
    });
  }
}
```

## Integration with App Layer

The API client is used by the App layer for actual data operations:

```tsx
// In app/sources/user.ts
export class User<TRole extends Role> {
  async list(): Promise<ListResponse<UserForRole<TRole>>> {
    return api("user").list(); // Uses Runtime API client
  }
  
  async get(id: string): Promise<UserForRole<TRole>> {
    return api("user").get(id); // Uses Runtime API client
  }
}
```

The API client provides the Runtime API compatibility while the App layer provides type safety and role-based access control.

## Best Practices

1. **Use Business Object IDs** - Use `api("user")` not `api("users")`
2. **Handle errors consistently** - Always wrap API calls in try/catch
3. **Configure once** - Set base URL and headers at app startup
4. **Leverage structured filtering** - Use the full power of filter operators
5. **Use multi-field sorting** - Provide consistent ordering
6. **Specify fields when needed** - Use `Field` array for large datasets
7. **Handle workflow fields** - Be aware of ActivityFlow field behavior
8. **Use pagination** - Set appropriate `PageSize` for performance

## API Specification Compliance

This client is fully compliant with the Runtime CRUD API specification:

- ✅ Correct URL patterns: `/api/app/{bo_id}/<operation>`
- ✅ Proper HTTP methods: GET for read, POST for create/update/list, DELETE for delete
- ✅ Structured request/response formats
- ✅ Complex filtering with all supported operators
- ✅ Multi-field sorting with ASC/DESC
- ✅ Datetime encoding/decoding
- ✅ Workflow field support
- ✅ Pagination and field selection
- ✅ Error handling for all documented error cases