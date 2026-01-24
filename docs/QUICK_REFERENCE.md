# KF AI SDK - Quick Reference

Quick reference for common operations. See individual hook docs for detailed examples.

## Installation

```bash
npm install @ram_28/kf-ai-sdk
```

```typescript
import { setApiBaseUrl } from "@ram_28/kf-ai-sdk/api";
setApiBaseUrl("https://api.your-domain.com");
```

---

## useTable

[Full Documentation](./useTable.md)

```typescript
import { useTable } from "@ram_28/kf-ai-sdk/table";

const table = useTable<Product>({
  source: "BDO_Products",
  columns: [
    { fieldId: "Title", enableSorting: true },
    { fieldId: "Price", enableSorting: true },
  ],
  initialState: {
    pagination: { pageNo: 1, pageSize: 10 },
  },
});
```

| Property | Description |
|----------|-------------|
| `table.rows` | Current data |
| `table.isLoading` | Loading state |
| `table.search.setQuery(q)` | Set search |
| `table.sort.toggle(field)` | Toggle sort |
| `table.filter.addCondition({...})` | Add filter |
| `table.pagination.goToNext()` | Next page |

---

## useForm

[Full Documentation](./useForm.md)

```typescript
import { useForm } from "@ram_28/kf-ai-sdk/form";

const form = useForm<Product>({
  source: "BDO_Products",
  operation: "create", // or "update"
  recordId: "...",     // for update
});
```

| Property | Description |
|----------|-------------|
| `form.register(field)` | Register input |
| `form.handleSubmit(onSuccess, onError)` | Submit handler |
| `form.errors` | Validation errors |
| `form.isValid` | Form validity |
| `form.getField(name)` | Field metadata |
| `form.watch(field)` | Watch value |

---

## useKanban

[Full Documentation](./useKanban.md)

```typescript
import { useKanban } from "@ram_28/kf-ai-sdk/kanban";

const kanban = useKanban<TaskData>({
  source: "BDO_Tasks",
  columns: [
    { id: "todo", title: "To Do", position: 0 },
    { id: "done", title: "Done", position: 1 },
  ],
  enableDragDrop: true,
});
```

| Property | Description |
|----------|-------------|
| `kanban.columns` | Columns with cards |
| `kanban.createCard({...})` | Create card |
| `kanban.moveCard(id, columnId)` | Move card |
| `kanban.getCardProps(card)` | Drag props |
| `kanban.filter.addCondition({...})` | Filter cards |

---

## useFilter

[Full Documentation](./useFilter.md)

```typescript
import { useFilter, isCondition, isConditionGroup } from "@ram_28/kf-ai-sdk/filter";

const filter = useFilter({
  initialOperator: "And",
});
```

| Property | Description |
|----------|-------------|
| `filter.addCondition({...})` | Add condition |
| `filter.addConditionGroup(op)` | Add group |
| `filter.clearAllConditions()` | Clear all |
| `filter.payload` | API-ready payload |
| `filter.hasConditions` | Has filters |

### Operators

| Operator | Description |
|----------|-------------|
| `EQ`, `NE` | Equal, Not Equal |
| `GT`, `GTE`, `LT`, `LTE` | Comparisons |
| `Between`, `NotBetween` | Range |
| `IN`, `NIN` | List match |
| `Contains`, `NotContains` | Text search |
| `Empty`, `NotEmpty` | Null check |

---

## useAuth

[Full Documentation](./useAuth.md)

```typescript
import { useAuth, AuthProvider } from "@ram_28/kf-ai-sdk/auth";

// Wrap app
<AuthProvider config={{ sessionEndpoint: "/api/id" }}>
  <App />
</AuthProvider>

// Use in components
const auth = useAuth();
```

| Property | Description |
|----------|-------------|
| `auth.user` | Current user |
| `auth.isAuthenticated` | Auth status |
| `auth.login(provider?)` | Sign in |
| `auth.logout()` | Sign out |
| `auth.hasRole(role)` | Check role |
| `auth.hasAnyRole(roles)` | Check roles |

---

## Common Patterns

### Filter by Category

```typescript
table.filter.clearAllConditions();
table.filter.addCondition({
  Operator: "EQ",
  LHSField: "Category",
  RHSValue: "Electronics",
});
```

### Filter by Date Range

```typescript
table.filter.addCondition({
  Operator: "Between",
  LHSField: "CreatedAt",
  RHSValue: [startDate, endDate],
});
```

### My Tasks Filter

```typescript
table.filter.addCondition({
  Operator: "EQ",
  LHSField: "AssignedTo",
  RHSValue: currentUserId,
});
```

### Sortable Column Header

```typescript
<th onClick={() => table.sort.toggle("Price")}>
  Price {table.sort.field === "Price" && (table.sort.direction === "asc" ? "↑" : "↓")}
</th>
```

### Pagination Controls

```typescript
<button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>
  Previous
</button>
<span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
<button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>
  Next
</button>
```

### Protected Route

```typescript
function ProtectedRoute({ children }) {
  const auth = useAuth();
  if (auth.isLoading) return <div>Loading...</div>;
  if (!auth.isAuthenticated) return <div>Please sign in</div>;
  return children;
}
```

### Role-Based UI

```typescript
{auth.hasRole("Admin") && <AdminPanel />}
{auth.hasAnyRole(["Seller", "Admin"]) && <ProductManagement />}
```

---

## Date Handling

### Display Encoded Date
```typescript
import { decodeDate } from "@ram_28/kf-ai-sdk/api";
import { formatDate } from "@ram_28/kf-ai-sdk/utils";

const readable = formatDate(decodeDate(record.OrderDate), 'medium');
// => "Mar 15, 2025"
```

### Display Timestamp
```typescript
import { decodeDateTime } from "@ram_28/kf-ai-sdk/api";
import { formatDateTime } from "@ram_28/kf-ai-sdk/utils";

const readable = formatDateTime(decodeDateTime(record._created_at), 'medium');
// => "Mar 15, 2025, 10:30:45 AM"
```

[Full Documentation](./datetime.md)

---

## Type Imports

```typescript
// Table
import type { UseTableOptionsType, UseTableReturnType, ColumnDefinitionType } from "@ram_28/kf-ai-sdk/table/types";

// Form
import type { UseFormOptionsType, UseFormReturnType, FormFieldConfigType } from "@ram_28/kf-ai-sdk/form/types";

// Kanban
import type { UseKanbanOptionsType, UseKanbanReturnType, KanbanCardType, ColumnConfigType } from "@ram_28/kf-ai-sdk/kanban/types";

// Filter
import type { ConditionType, ConditionGroupType, ConditionOperatorType, FilterType } from "@ram_28/kf-ai-sdk/filter/types";

// Auth
import type { UseAuthReturnType, UserDetailsType, AuthStatusType } from "@ram_28/kf-ai-sdk/auth/types";
```
