# useActivityTable Hook

A thin wrapper around the base `useTable` hook for listing workflow activity (business process) instances. It delegates to `useTable` internally, providing the same search, sort, filter, and pagination capabilities tailored to activity data.

## Imports

```typescript
import {
  useActivityTable,
  ActivityTableStatus,
} from '@ram_28/kf-ai-sdk/workflow';

import type {
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityRowType,
  ActivityInstanceFieldsType,
} from '@ram_28/kf-ai-sdk/workflow';
```

---

## Type Definitions

### ActivityTableStatus

Constant object that determines which endpoint the hook calls (in-progress list vs completed list).

```typescript
export const ActivityTableStatus = {
  InProgress: 'inprogress',
  Completed: 'completed',
} as const;

export type ActivityTableStatusType =
  (typeof ActivityTableStatus)[keyof typeof ActivityTableStatus];
```

### ActivityRowType\<A\>

Row type for activity table data. System fields (`_id`, `Status`, `AssignedTo`, `CompletedAt`) live at the top level. Entity-specific fields are nested under the `ADO` property.

```typescript
export type ActivityRowType<A extends Activity<any, any, any>> =
  A extends Activity<infer E, any, any>
    ? ActivityInstanceFieldsType & { ADO: E }
    : never;
```

Concrete example -- for an `EmployeeInputActivity` with `{ StartDate, EndDate, LeaveType, LeaveDays }`:

```typescript
// ActivityRowType<EmployeeInputActivity> resolves to:
{
  // System fields (from ActivityInstanceFieldsType)
  _id: string;
  Status: 'InProgress' | 'Completed';
  AssignedTo: UserFieldType;
  CompletedAt: string;
  BPInstanceId: string;

  // Entity fields (nested under ADO)
  ADO: {
    StartDate: string;
    EndDate: string;
    LeaveType: 'PTO' | 'Sick' | 'Parental';
    LeaveDays: number;
  };
}
```

### UseActivityTableOptionsType\<A\>

```typescript
export interface UseActivityTableOptionsType<A extends Activity<any, any, any>> {
  /** Which activity instances to fetch -- determines endpoint */
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

The return type is the full `UseTableReturnType<ActivityRowType<A>>` -- identical to what `useTable` returns. This includes `rows`, `totalItems`, `search`, `sort`, `filter`, `pagination`, `refetch`, `isLoading`, `isFetching`, and `error`.

```typescript
export type UseActivityTableReturnType<A extends Activity<any, any, any>> =
  UseTableReturnType<ActivityRowType<A>>;
```

See the [useTable docs](./useTable.md) for the full shape of `UseTableReturnType`.

---

## Signature

```typescript
function useActivityTable<A extends Activity<any, any, any>>(
  activity: A,
  options: UseActivityTableOptionsType<A>,
): UseActivityTableReturnType<A>;
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `activity` | `A` | An `Activity` instance (from a generated workflow class) |
| `options` | `UseActivityTableOptionsType<A>` | Status, initial state, and callbacks |

**Returns:** `UseActivityTableReturnType<A>` -- the full `UseTableReturnType` parameterized with `ActivityRowType<A>`.

---

## Example: Employee Leave Request Table

Display in-progress leave requests for the employee with search, pagination, and a detail view.

```tsx
import { useMemo, useState } from 'react';
import { useActivityTable, ActivityTableStatus } from '@ram_28/kf-ai-sdk/workflow';
import type { ActivityRowType } from '@ram_28/kf-ai-sdk/workflow';
import {
  SimpleLeaveProcess,
  EmployeeInputActivity,
} from '@/bdo/workflows/SimpleLeaveProcess';

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
  } = useActivityTable(activity, {
    status: ActivityTableStatus.InProgress,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
    },
    onError: (err) => console.error('Failed to load leave requests:', err.message),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>My Leave Requests ({totalItems})</h2>

      {/* Search */}
      <div>
        <input
          type='text'
          placeholder='Search by leave type...'
          value={search.query}
          onChange={(e) => search.set('ADO', e.target.value)}
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
              style={{ cursor: 'pointer' }}
              onClick={() => sort.toggle('ADO' as any)}
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
              <td>{row.AssignedTo._name}</td>
              <td>{row.ADO.LeaveType}</td>
              <td>{row.ADO.StartDate}</td>
              <td>{row.ADO.EndDate}</td>
              <td>{row.ADO.LeaveDays}</td>
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

Display pending approvals for a manager, with status tabs for in-progress and completed items.

```tsx
import { useMemo, useState } from 'react';
import {
  useActivityTable,
  ActivityTableStatus,
} from '@ram_28/kf-ai-sdk/workflow';
import type {
  ActivityRowType,
  UseActivityTableOptionsType,
} from '@ram_28/kf-ai-sdk/workflow';
import {
  SimpleLeaveProcess,
  ManagerApprovalActivity,
} from '@/bdo/workflows/SimpleLeaveProcess';

type StatusTab = 'inprogress' | 'completed';

function ManagerApprovalTable() {
  const activity = useMemo(
    () => new SimpleLeaveProcess().managerApprovalActivity(),
    [],
  );
  const [activeTab, setActiveTab] = useState<StatusTab>('inprogress');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const options: UseActivityTableOptionsType<ManagerApprovalActivity> = {
    status: activeTab,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
    },
    onError: (err) => console.error('Fetch failed:', err.message),
  };

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
  } = useActivityTable(activity, options);

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
          onClick={() => setActiveTab('inprogress')}
          disabled={activeTab === 'inprogress'}
        >
          Pending
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          disabled={activeTab === 'completed'}
        >
          Completed
        </button>
      </div>

      <h2>
        {activeTab === 'inprogress' ? 'Pending' : 'Completed'} Approvals ({totalItems})
      </h2>

      {/* Search */}
      <input
        type='text'
        placeholder='Search...'
        value={search.query}
        onChange={(e) => search.set('_id', e.target.value)}
      />

      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => sort.toggle('Status')}
            >
              Status
              {sort.field === 'Status' && (
                <span>{sort.direction === 'ASC' ? ' ↑' : ' ↓'}</span>
              )}
            </th>
            <th>Assigned To</th>
            <th>Approved</th>
            <th>Reason</th>
            {activeTab === 'inprogress' && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._id}>
              <td>{row._id}</td>
              <td>{row.Status}</td>
              <td>{row.AssignedTo._name}</td>
              <td>{row.ADO.ManagerApproved ? 'Yes' : 'No'}</td>
              <td>{row.ADO.ManagerReason}</td>
              {activeTab === 'inprogress' && (
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

## Accessing Entity Fields

Activity row data has a two-level structure. System fields (`_id`, `Status`, `AssignedTo`, `CompletedAt`, `BPInstanceId`) are at the top level. Entity-specific fields are nested under the `ADO` property.

```typescript
// System fields -- top level
row._id
row.Status
row.AssignedTo._name
row.CompletedAt

// Entity fields -- under ADO
row.ADO.StartDate
row.ADO.LeaveType
row.ADO.LeaveDays
row.ADO.ManagerApproved
```

This is different from BDO tables where all fields are at the top level. With activity tables, always access entity fields through `row.ADO`.

---

## Search, Sort, Filter, and Pagination

Because `useActivityTable` wraps `useTable`, all table state management works identically. The full API is available:

- **search** -- `search.set(field, query)`, `search.clear()`, `search.query`, `search.field`
- **sort** -- `sort.toggle(field)`, `sort.set(field, direction)`, `sort.clear()`
- **filter** -- `filter.addCondition(...)`, `filter.removeCondition(...)`, `filter.clearAllConditions()`
- **pagination** -- `pagination.goToNext()`, `pagination.goToPrevious()`, `pagination.goToPage(n)`, `pagination.setPageSize(n)`

Refer to the [useTable docs](./useTable.md) for the complete API reference for each of these capabilities.

---

## Common Mistakes

### 1. Accessing entity fields at the top level

Entity fields live under `ADO`, not at the top level. This is different from BDO tables.

```typescript
// WRONG -- entity fields are not at the top level
row.StartDate
row.LeaveType
row.ManagerApproved

// CORRECT -- access entity fields through ADO
row.ADO.StartDate
row.ADO.LeaveType
row.ADO.ManagerApproved
```

### 2. Passing a Workflow instead of an Activity

The first argument must be an `Activity` instance, not a `Workflow` instance.

```typescript
// WRONG -- passing the workflow class
const wf = new SimpleLeaveProcess();
useActivityTable(wf, { status: ActivityTableStatus.InProgress });

// CORRECT -- pass the activity instance
const activity = new SimpleLeaveProcess().employeeInputActivity();
useActivityTable(activity, { status: ActivityTableStatus.InProgress });
```

### 3. Using string literals instead of ActivityTableStatus

While string literals work at runtime, always use the `ActivityTableStatus` constant for type safety and readability.

```typescript
// WRONG -- raw string (no type safety, easy to typo)
useActivityTable(activity, { status: 'inProgress' });
useActivityTable(activity, { status: 'in_progress' });

// CORRECT -- use the constant
useActivityTable(activity, { status: ActivityTableStatus.InProgress });
useActivityTable(activity, { status: ActivityTableStatus.Completed });

// ALSO VALID -- exact string literals
useActivityTable(activity, { status: 'inprogress' });
useActivityTable(activity, { status: 'completed' });
```

### 4. Forgetting to memoize the activity instance

Like BDO instances passed to `useTable`, the activity instance should be memoized to prevent unnecessary re-renders and refetches.

```typescript
// WRONG -- creates a new activity on every render
const activity = new SimpleLeaveProcess().employeeInputActivity();
useActivityTable(activity, { status: ActivityTableStatus.InProgress });

// CORRECT -- memoize with useMemo
const activity = useMemo(
  () => new SimpleLeaveProcess().employeeInputActivity(),
  [],
);
useActivityTable(activity, { status: ActivityTableStatus.InProgress });
```

### 5. Using useTable directly for activity data

Use `useActivityTable` instead of `useTable` for activity data. The hook handles the query key construction, endpoint selection based on status, and proper typing automatically.

```typescript
// WRONG -- manual setup with useTable
useTable({
  queryKey: ['activity-table', bpId, activityId, 'inprogress'],
  listFn: (opts) => activity._getOps().inProgressList(opts),
  countFn: (opts) => activity._getOps().inProgressMetric(opts),
});

// CORRECT -- let useActivityTable handle it
useActivityTable(activity, { status: ActivityTableStatus.InProgress });
```

### 6. Calling .get() on activity table rows

Table rows are plain objects, not `ActivityInstance` proxies. There is no `.get()` method.

```typescript
// WRONG -- rows are plain objects
row.ADO.StartDate.get();
row.Status.get();

// CORRECT -- access values directly
row.ADO.StartDate;
row.Status;
```
