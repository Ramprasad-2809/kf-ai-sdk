# useActivityTable

Hook for listing workflow activity (business process) instances with search, sort, filter, and pagination.

## Imports

```typescript
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import type {
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityRowType,
  ActivityInstanceFieldsType,
} from "@ram_28/kf-ai-sdk/workflow";
```

---

## Common Mistakes (READ FIRST)

### 1. Passing a Workflow instead of an Activity

The `activity` property must be an `Activity` instance, not a `Workflow` instance.

```typescript
// ❌ WRONG — passing the workflow class
const wf = new SimpleLeaveProcess();
useActivityTable({ activity: wf, status: ActivityTableStatus.InProgress });

// ✅ CORRECT — pass the activity instance
const activity = new SimpleLeaveProcess().employeeInputActivity();
useActivityTable({ activity, status: ActivityTableStatus.InProgress });
```

### 2. Using string literals instead of ActivityTableStatus

While string literals work at runtime, always use the `ActivityTableStatus` constant for type safety and readability.

```typescript
// ❌ WRONG — raw string (no type safety, easy to typo)
useActivityTable({ activity, status: "inProgress" });
useActivityTable({ activity, status: "in_progress" });

// ✅ CORRECT — use the constant
useActivityTable({ activity, status: ActivityTableStatus.InProgress });
useActivityTable({ activity, status: ActivityTableStatus.Completed });
```

### 3. Forgetting to memoize the activity instance

Like BDO instances passed to `useBDOTable`, the activity instance should be memoized to prevent unnecessary re-renders and refetches.

```typescript
// ❌ WRONG — creates a new activity on every render
const activity = new SimpleLeaveProcess().employeeInputActivity();
useActivityTable({ activity, status: ActivityTableStatus.InProgress });

// ✅ CORRECT — memoize with useMemo
const activity = useMemo(
  () => new SimpleLeaveProcess().employeeInputActivity(),
  [],
);
useActivityTable({ activity, status: ActivityTableStatus.InProgress });
```

### 4. Calling `.get()` on activity table rows

Table rows are plain objects, not `ActivityInstance` proxies. There is no `.get()` method.

```typescript
// ❌ WRONG — rows are plain objects
row.StartDate.get();
row.Status.get();

// ✅ CORRECT — access values directly
row.StartDate;
row.Status;
```

---

## Example: Employee Leave Request Table

Display in-progress leave requests with search, pagination, and a detail view.

```tsx
import { useMemo, useState } from "react";
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import type { ActivityRowType } from "@ram_28/kf-ai-sdk/workflow";
import {
  SimpleLeaveProcess,
  EmployeeInputActivity,
} from "@/bdo/workflows/SimpleLeaveProcess";

function EmployeeLeaveTable() {
  const activity = useMemo(() => new SimpleLeaveProcess().employeeInputActivity(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    rows,
    totalItems,
    isLoading,
    isFetching,
    error,
    search,
    sort,
    pagination,
    refetch,
  } = useActivityTable({
    activity,
    status: ActivityTableStatus.InProgress,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
    },
    onError: (err) => console.error("Failed to load leave requests:", err.message),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>My Leave Requests ({totalItems})</h2>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by leave type..."
          value={search.query}
          onChange={(e) => search.set(activity.LeaveType.id, e.target.value)}
        />
        {search.query && <button onClick={search.clear}>Clear</button>}
        {isFetching && <span>Loading...</span>}
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => sort.toggle(activity.LeaveType.id)}
            >
              Leave Type
            </th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row._id}</td>
              <td>{row.Status}</td>
              <td>{row.AssignedTo.map((u) => u._name).join(", ")}</td>
              <td>{row.LeaveType}</td>
              <td>{row.StartDate}</td>
              <td>{row.EndDate}</td>
              <td>{row.LeaveDays}</td>
              <td>
                <button onClick={() => setSelectedId(row._id)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button
          onClick={pagination.goToPrevious}
          disabled={!pagination.canGoPrevious}
        >
          Previous
        </button>
        <span>
          Page {pagination.pageNo} of {pagination.totalPages}
        </span>
        <button
          onClick={pagination.goToNext}
          disabled={!pagination.canGoNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Example: Manager Approval Table

Display pending approvals with status tabs for in-progress and completed items.

```tsx
import { useMemo, useState } from "react";
import {
  useActivityTable,
  ActivityTableStatus,
} from "@ram_28/kf-ai-sdk/workflow";
import type { ActivityRowType } from "@ram_28/kf-ai-sdk/workflow";
import { SimpleLeaveProcess } from "@/bdo/workflows/SimpleLeaveProcess";

type StatusTab = "inprogress" | "completed";

function ManagerApprovalTable() {
  const activity = useMemo(
    () => new SimpleLeaveProcess().managerApprovalActivity(),
    [],
  );
  const [activeTab, setActiveTab] = useState<StatusTab>("inprogress");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    rows,
    totalItems,
    isLoading,
    isFetching,
    error,
    search,
    sort,
    filter,
    pagination,
    refetch,
  } = useActivityTable({
    activity,
    status: activeTab,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
    },
    onError: (err) => console.error("Fetch failed:", err.message),
  });

  if (selectedId) {
    return (
      <ApprovalForm
        activityInstanceId={selectedId}
        onComplete={() => {
          setSelectedId(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div>
      {/* Status tabs */}
      <div>
        <button
          onClick={() => setActiveTab("inprogress")}
          disabled={activeTab === "inprogress"}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          disabled={activeTab === "completed"}
        >
          Completed
        </button>
      </div>

      <h2>
        {activeTab === "inprogress" ? "Pending" : "Completed"} Approvals ({totalItems})
      </h2>

      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th
              style={{ cursor: "pointer" }}
              onClick={() => sort.toggle("Status")}
            >
              Status
              {sort.field === "Status" && (
                <span>{sort.direction === "ASC" ? " ↑" : " ↓"}</span>
              )}
            </th>
            <th>Assigned To</th>
            <th>Approved</th>
            <th>Reason</th>
            {activeTab === "inprogress" && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row._id}</td>
              <td>{row.Status}</td>
              <td>{row.AssignedTo.map((u) => u._name).join(", ")}</td>
              <td>{row.ManagerApproved ? "Yes" : "No"}</td>
              <td>{row.ManagerReason}</td>
              {activeTab === "inprogress" && (
                <td>
                  <button onClick={() => setSelectedId(row._id)}>Review</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button
          onClick={pagination.goToPrevious}
          disabled={!pagination.canGoPrevious}
        >
          Previous
        </button>
        <span>
          Page {pagination.pageNo} of {pagination.totalPages}
        </span>
        <button
          onClick={pagination.goToNext}
          disabled={!pagination.canGoNext}
        >
          Next
        </button>
        <select
          value={pagination.pageSize}
          onChange={(e) => pagination.setPageSize(Number(e.target.value))}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
        </select>
      </div>
    </div>
  );
}
```

---

## Type Definitions

### ActivityTableStatus

```typescript
export const ActivityTableStatus = {
  InProgress: "inprogress",
  Completed: "completed",
} as const;

export type ActivityTableStatusType =
  (typeof ActivityTableStatus)[keyof typeof ActivityTableStatus];
```

### ActivityRowType\<A\>

Row type for activity table data. System fields and entity fields are flat at the top level.

```typescript
export type ActivityRowType<A extends Activity<any, any, any>> =
  A extends Activity<infer E, any, any>
    ? ActivityInstanceFieldsType & E
    : never;
```

### UseActivityTableOptionsType\<A\>

```typescript
export interface UseActivityTableOptionsType<A extends Activity<any, any, any>> {
  /** The activity instance to fetch data for */
  activity: A;

  /** Which activity instances to fetch — determines endpoint */
  status: ActivityTableStatusType;

  /** Initial state for sort, pagination, and filter */
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<ActivityRowType<A>>;
  };

  /** Called when data fetch fails */
  onError?: (error: Error) => void;

  /** Called with fetched rows after successful load */
  onSuccess?: (data: ActivityRowType<A>[]) => void;
}
```

### UseActivityTableReturnType\<A\>

```typescript
export type UseActivityTableReturnType<A extends Activity<any, any, any>> =
  UseTableReturnType<ActivityRowType<A>>;
```

The return type is identical to `UseTableReturnType`. All properties — `rows`, `totalItems`, `isLoading`, `isFetching`, `error`, `search`, `sort`, `filter`, `pagination`, and `refetch` — behave the same.

---

## Search, Sort, Filter, and Pagination

`useActivityTable` supports `initialState`, `onError`, and `onSuccess` options.

- **Search** — `search.set(field, query)`, `search.clear()`, 300ms debounce
- **Sort** — `sort.toggle(field)`, `sort.set(field, direction)`, `sort.clear()`
- **Filter** — `filter.addCondition(...)`, `filter.removeCondition(...)`, `filter.clearAllConditions()`
- **Pagination** — `pagination.goToNext()`, `pagination.goToPrevious()`, `pagination.goToPage(n)`, `pagination.setPageSize(n)`
