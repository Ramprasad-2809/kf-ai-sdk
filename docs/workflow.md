# Workflow SDK API

The Workflow SDK provides a type-safe client for orchestrating business processes (workflows). Each workflow has typed Activity classes with field definitions, and a React hook (`useActivityForm`) for building forms bound to activity input fields.

## Imports

```typescript
// Runtime exports
import {
  Workflow,
  Activity,
  ActivityInstance,
  useActivityForm,
  useActivityTable,
  ActivityTableStatus,
} from "@ram_28/kf-ai-sdk/workflow";

// Type-only exports
import type {
  ActivityInstanceFieldsType,
  ActivityProgressType,
  WorkflowStartResponseType,
  UseActivityFormOptions,
  UseActivityFormReturn,
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityTableStatusType,
  ActivityRowType,
} from "@ram_28/kf-ai-sdk/workflow";

// Field classes (for defining Activity fields)
import {
  StringField,
  NumberField,
  BooleanField,
  DateField,
  DateTimeField,
  SelectField,
  ReferenceField,
} from '@ram_28/kf-ai-sdk/bdo/fields';

// Field types (for entity type definitions)
import type {
  StringFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  SelectFieldType,
  ReferenceFieldType,
} from '@ram_28/kf-ai-sdk/types';
```

---

## Type Definitions

### WorkflowStartResponseType

```typescript
interface WorkflowStartResponseType {
  BPInstanceId: string;  // Business process instance ID
  ActivityId: string;    // First activity ID in the workflow
  _id: string;           // Activity instance ID
}
```

### ActivityProgressType

```typescript
interface ActivityProgressType {
  ActivityId: string;
  ActivityInstanceId: string;
  ActivityType: string;
  AssignedTo: { Type: string; _id: string }[];
  CompletedAt: string | null;
  CompletedBy: { _id: string; _name: string } | null;
  Status: "COMPLETED" | "IN_PROGRESS";
  _name: string;
}
```

### ActivityInstanceFieldsType

System fields present on every activity instance. Returned alongside activity-specific fields from `getInProgressList()` and `getCompletedList()`.

```typescript
type ActivityInstanceFieldsType = {
  _id: StringFieldType;
  Status: SelectFieldType<"InProgress" | "Completed">;
  AssignedTo: UserFieldType[];
  CompletedAt: DateTimeFieldType;
};
```

### Activity Table Types

See the dedicated [useActivityTable documentation](./useActivityTable.md) for `ActivityTableStatus`, `ActivityRowType`, `UseActivityTableOptionsType`, and `UseActivityTableReturnType`.

Entity fields and system fields are flat at the top level, same as BDO tables. Access entity fields as `row.FieldName`.


### UseActivityFormOptions\<A\> / UseActivityFormReturn\<A\>

See the dedicated [useActivityForm documentation](./useActivityForm.md) for the full type definitions.

### File & Image Types

Image accessor: `item.field.get()` returns `FileType | null`. Has `upload(file: File)`, `deleteAttachment()`, `getDownloadUrl()`.
File accessor: `item.field.get()` returns `FileType[]`. Has `upload(files: File[])`, `deleteAttachment(id)`, `getDownloadUrl(id)`.

Activity forms always have an instance ID, so attachment operations work immediately — no draft creation is needed.

---

## Generated Workflow SDK

Each workflow generates a TypeScript SDK with typed Activity classes and a Workflow class. These are defined in `src/bdo/workflows/` and should never be created manually.

### Example: SimpleLeaveProcess SDK

```typescript
// --- Activity classes ---

export type EmployeeInputEntityType = {
  StartDate: DateFieldType;
  EndDate: DateFieldType;
  LeaveType: SelectFieldType<"PTO" | "Sick" | "Parental">;
  LeaveDays: NumberFieldType;
};

export type EmployeeInputEditable = Omit<EmployeeInputEntityType, "LeaveDays">;
export type EmployeeInputReadonly = Pick<EmployeeInputEntityType, "LeaveDays">;

export class EmployeeInputActivity extends Activity<
  EmployeeInputEntityType,
  EmployeeInputEditable,
  EmployeeInputReadonly
> {
  readonly meta = {
    businessProcessId: "SimpleLeaveProcess",
    activityId: "EMPLOYEE_INPUT",
  };

  readonly StartDate = new DateField({ "_id": "StartDate", "Name": "Start Date", "Type": "Date" });
  readonly EndDate = new DateField({ "_id": "EndDate", "Name": "End Date", "Type": "Date" });
  readonly LeaveType = new SelectField<"PTO" | "Sick" | "Parental">({
    "_id": "LeaveType", "Name": "Leave Type", "Type": "String",
    "Constraint": { "Enum": ["PTO", "Sick", "Parental"] },
  });
  readonly LeaveDays = new NumberField({ "_id": "LeaveDays", "Name": "Leave Days", "Type": "Number", "ReadOnly": true });
}

export type ManagerApprovalEntityType = {
  ManagerApproved: BooleanFieldType;
  ManagerReason: StringFieldType;
};

export class ManagerApprovalActivity extends Activity<
  ManagerApprovalEntityType,
  ManagerApprovalEntityType,
  {}
> {
  readonly meta = {
    businessProcessId: "SimpleLeaveProcess",
    activityId: "MANAGER_APPROVAL",
  };

  readonly ManagerApproved = new BooleanField({ "_id": "ManagerApproved", "Name": "Manager Approved", "Type": "Boolean" });
  readonly ManagerReason = new StringField({ "_id": "ManagerReason", "Name": "Manager's Reason", "Type": "String" });
}

// --- Workflow class ---

export class SimpleLeaveProcess {
  async start(): Promise<WorkflowStartResponseType>;
  async progress(instance_id: string): Promise<ActivityProgressType[]>;

  employeeInputActivity(): EmployeeInputActivity;
  managerApprovalActivity(): ManagerApprovalActivity;
}
```

---

## Workflow Class

### start()

Start a new workflow instance.

```typescript
const wf = new SimpleLeaveProcess();
const { BPInstanceId, ActivityId, _id } = await wf.start();
```

### progress(instance_id)

Get progress for a specific process instance. Returns a list of progress entries for each stage/activity.

```typescript
const wf = new SimpleLeaveProcess();
const { BPInstanceId } = await wf.start();
const progressList = await wf.progress(BPInstanceId);
// progressList: ActivityProgressType[]
for (const entry of progressList) {
  console.log(entry._name, entry.Status, entry.CompletedAt);
}
```

**Endpoint:** `GET /api/app/process/{bp_id}/{instance_id}/progress`

---

## Activity Class

Each Activity class provides methods to query and access activity instances. List and metric operations are split by status (`inprogress` / `completed`).

```typescript
const activity = wf.employeeInputActivity();
```

### getInProgressList(options?)

List in-progress activity instances. Accepts optional `ListOptionsType` payload for server-side filtering, sorting, and pagination.

```typescript
// No options — returns all in-progress items (default pagination)
const result = await activity.getInProgressList();

for (const item of result.Data) {
  console.log(item._id, item.Status, item.StartDate);
}

// With options — server-side filter, sort, and pagination
const filtered = await activity.getInProgressList({
  Filter: { Operator: 'And', Condition: [{ LHSField: 'Status', Operator: 'EQ', RHSValue: 'InProgress', RHSType: 'Constant' }] },
  Sort: [{ '_created_at': 'DESC' }],
  Page: 1,
  PageSize: 10,
});
```

### getCompletedList(options?)

List completed activity instances. Same options as `getInProgressList`.

```typescript
const result = await activity.getCompletedList();

for (const item of result.Data) {
  console.log(item._id, item.CompletedAt, item.StartDate);
}
```

### inProgressMetrics(options?)

Get count of in-progress activity instances. Returns `CountResponseType` (`{ Count: number }`).

```typescript
const { Count } = await activity.inProgressMetrics();
console.log('In-progress count:', Count);
```

### completedMetrics(options?)

Get count of completed activity instances. Returns `CountResponseType` (`{ Count: number }`).

```typescript
const { Count } = await activity.completedMetrics();
console.log('Completed count:', Count);
```

### getInstance(instanceId)

Get a typed ActivityInstance with field accessors and persistence methods.

```typescript
const instance = await activity.getInstance("inst_abc123");

// Field accessors (BDO Item pattern)
instance._id;                          // "inst_abc123"
instance.StartDate.get();              // read value (typed)
instance.StartDate.set("2026-03-01");  // set value (editable fields only)
instance.StartDate.meta;               // { _id: "StartDate", Name: "Start Date", Type: "Date" }
instance.LeaveDays.get();              // read computed/readonly field
// instance.LeaveDays.set(...)         // NOT available — readonly, no set()

// Utility methods
instance.toJSON();                     // convert to plain object
instance.validate();                   // validate all fields

// Persistence methods
await instance.update({ StartDate: "2026-03-01" });  // update fields
await instance.save({ StartDate: "2026-03-01" });    // save and commit
await instance.complete();                            // complete the activity
const progress = await instance.progress();           // get progress (ActivityProgressType[])
```

---

## useActivityForm Hook

See the dedicated [useActivityForm documentation](./useActivityForm.md) for the full API reference, type definitions, and examples.

---

## useActivityTable Hook

See the dedicated [useActivityTable documentation](./useActivityTable.md) for the full API reference, type definitions, and examples.

`useActivityTable` provides search, sort, filter, and pagination capabilities, same as `useBDOTable`. Entity fields are accessed at the top level (e.g., `row.FieldName`).

---


## Use Case: Employee Creating Leave

### Step 1 — Start the workflow

```typescript
import { SimpleLeaveProcess } from "@/bdo/workflows/SimpleLeaveProcess";
import type { WorkflowStartResponseType } from "@ram_28/kf-ai-sdk/workflow";

const wf = new SimpleLeaveProcess();
const { BPInstanceId, ActivityId, _id }: WorkflowStartResponseType = await wf.start();

// Check progress at any time
const progress = await wf.progress(BPInstanceId);
```

### Step 2 — React component with useActivityForm

See [useActivityForm](./useActivityForm.md) for the full form component example.

### Full flow orchestration

```tsx
import { useState } from "react";
import { SimpleLeaveProcess } from "@/bdo/workflows/SimpleLeaveProcess";
import type { WorkflowStartResponseType } from "@ram_28/kf-ai-sdk/workflow";

function LeaveRequestPage() {
  const [instanceId, setInstanceId] = useState<string | null>(null);

  const startLeaveRequest = async () => {
    const wf = new SimpleLeaveProcess();
    const result: WorkflowStartResponseType = await wf.start();
    setInstanceId(result._id);
  };

  if (!instanceId) {
    return <button onClick={startLeaveRequest}>New Leave Request</button>;
  }

  return (
    <LeaveRequestForm
      activityInstanceId={instanceId}
      onComplete={() => setInstanceId(null)}
    />
  );
}
```

---

## Use Case: Manager Approving Leave

### Step 1 — List in-progress items

```tsx
import { useMemo, useState } from "react";
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import { SimpleLeaveProcess, ManagerApprovalActivity } from "@/bdo/workflows/SimpleLeaveProcess";

const wf = new SimpleLeaveProcess();
const activity = wf.managerApprovalActivity();

  const { rows, totalItems, isLoading, error, pagination, refetch } = useActivityTable({
    activity,
    status: ActivityTableStatus.InProgress,
    initialState: {
      pagination: { pageNo: 1, pageSize: 10 },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

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
      <h2>Pending Approvals ({totalItems})</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Approved</th>
            <th>Reason</th>
            <th>Action</th>
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
              <td>
                <button onClick={() => setSelectedId(row._id)}>Review</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={pagination.goToPrevious} disabled={!pagination.canGoPrevious}>Previous</button>
        <span>Page {pagination.pageNo} of {pagination.totalPages}</span>
        <button onClick={pagination.goToNext} disabled={!pagination.canGoNext}>Next</button>
      </div>
    </div>
  );
}
```

### Step 2 — Approval form component

See [useActivityForm](./useActivityForm.md) for the full approval form component example.

---

## Use Case: Programmatic ActivityInstance

For non-form scenarios (scripts, server-side, batch processing):

```typescript
import { SimpleLeaveProcess } from "@/bdo/workflows/SimpleLeaveProcess";

const wf = new SimpleLeaveProcess();
const activity = wf.employeeInputActivity();

// Get a typed instance
const instance = await activity.getInstance("inst_abc123");

// Read fields
console.log(instance.StartDate.get());   // "2026-02-01"
console.log(instance.LeaveType.get());   // "PTO"
console.log(instance.LeaveDays.get());   // 5 (computed)

// Write editable fields
instance.StartDate.set("2026-03-01");
instance.EndDate.set("2026-03-05");

// Field metadata
console.log(instance.StartDate.label);  // "Start Date"

// Persist changes
await instance.update({ StartDate: "2026-03-01", EndDate: "2026-03-05" });

// Save and commit
await instance.save({ StartDate: "2026-03-01", EndDate: "2026-03-05" });

// Complete activity
await instance.complete();

// Check progress (returns ActivityProgressType[])
const progress = await instance.progress();
```

---

## Filtering Reference

Status filtering is built into the method names (`getInProgressList` / `getCompletedList`). Internal filters (ActivityId, Status, AssignedTo) are **always applied** by the backend. Frontend filters passed via `ListOptionsType` are AND-merged with the internal filters.

All four list/metric endpoints now use **POST** with an optional `ListOptionsType` body (same shape as BDO list API: `{ Filter, Sort, Page, PageSize }`).

### In-progress items

```typescript
// No options — returns all (default pagination)
const result = await activity.getInProgressList();

// With filter + pagination
const result = await activity.getInProgressList({
  Sort: [{ '_created_at': 'DESC' }],
  Page: 1,
  PageSize: 25,
});
```

### Completed items

```typescript
const result = await activity.getCompletedList({
  Page: 1,
  PageSize: 25,
});
```

### Process progress

```typescript
const wf = new SimpleLeaveProcess();
const { BPInstanceId } = await wf.start();
const progressList = await wf.progress(BPInstanceId);
// Returns ActivityProgressType[] — one entry per activity in the process
```

---

## ActivityInstance System Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `_id` | `StringFieldType` | Unique activity instance identifier |
| `Status` | `SelectFieldType<"InProgress" \| "Completed">` | Current status |
| `AssignedTo` | `UserFieldType[]` | Assigned users (each has `._id` and `._name`) |
| `CompletedAt` | `DateTimeFieldType` | Completion timestamp (`"YYYY-MM-DDTHH:MM:SS"`) |

---
