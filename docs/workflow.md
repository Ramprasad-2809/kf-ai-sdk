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

**Key change:** Entity fields are now nested under `ADO` instead of being flattened at the top level. Access entity fields as `row.ADO.FieldName`.


### UseActivityFormOptions\<A\>

```typescript
interface UseActivityFormOptions<A extends Activity<any, any, any>> {
  /** Activity instance identifier (from wf.start() or getInProgressList()) */
  activity_instance_id: string;

  /** Default form values */
  defaultValues?: Partial<ExtractActivityEditable<A>>;

  /** Validation mode (default: "onBlur") */
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";

  /** Whether to load activity data on mount (default: true) */
  enabled?: boolean;
}
```

### UseActivityFormReturn\<A\>

```typescript
interface UseActivityFormReturn<A extends Activity<any, any, any>> {
  // Core
  item: FormItemType<EditableFields, ReadonlyFields>;
  activity: A;
  register: FormRegisterType<EditableFields, ReadonlyFields>;
  handleSubmit: HandleSubmitType;    // Save the activity form
  handleComplete: HandleSubmitType;  // Complete the activity

  // RHF methods
  watch: UseFormWatch;
  setValue: UseFormSetValue;
  getValues: UseFormGetValues;
  reset: UseFormReset;
  trigger: UseFormTrigger;
  control: Control;

  // Form state
  errors: FieldErrors;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;

  // Loading
  isLoading: boolean;
  loadError: Error | null;
  hasError: boolean;

  // Operations
  clearErrors: () => void;
}
```

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
  console.log(item._id, item.Status, item.ADO.StartDate);
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
  console.log(item._id, item.CompletedAt, item.ADO.StartDate);
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

React hook for building forms bound to workflow activity input fields. Integrates with `react-hook-form`.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activity_instance_id` | `string` | *required* | Activity instance ID (from `wf.start()` or `getInProgressList()`) |
| `defaultValues` | `Partial<Editable>` | `{}` | Initial form values |
| `mode` | `"onBlur" \| "onChange" \| "onSubmit" \| "onTouched" \| "all"` | `"onBlur"` | Validation timing |
| `enabled` | `boolean` | `true` | Whether to load activity data on mount |

### Lifecycle

```
Mount
  |
  |-> Load activity instance data -> populate form
  |
  v
User edits field -> blurs
  |
  |-> Field validation (BaseField.validate)
  |-> If valid + readonly fields exist -> update computed fields
  |
  v
User clicks Save
  |
  |-> handleSubmit -> save activity data
  |
  v
User clicks Complete
  |
  |-> handleComplete -> complete activity
```

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `item` | `FormItemType` | Proxy with typed field accessors (`.get()`, `.set()`, `.meta`) |
| `activity` | `A` | The Activity instance |
| `register` | `FormRegisterType` | Smart register (auto-disables readonly fields) |
| `handleSubmit` | `HandleSubmitType` | Save activity data |
| `handleComplete` | `HandleSubmitType` | Complete the activity |
| `watch` | `UseFormWatch` | Watch field values |
| `setValue` | `UseFormSetValue` | Set field value programmatically |
| `getValues` | `UseFormGetValues` | Get current field values |
| `reset` | `UseFormReset` | Reset form to default values |
| `trigger` | `UseFormTrigger` | Trigger validation |
| `control` | `Control` | RHF control (for Controller components) |
| `errors` | `FieldErrors` | Validation errors |
| `isValid` | `boolean` | Form is valid |
| `isDirty` | `boolean` | Form has been modified |
| `isSubmitting` | `boolean` | Currently submitting |
| `isSubmitSuccessful` | `boolean` | Last submission succeeded |
| `isLoading` | `boolean` | Loading activity data |
| `loadError` | `Error \| null` | Load error |
| `hasError` | `boolean` | Any error active |
| `clearErrors` | `() => void` | Clear all form errors |

---

## useActivityTable Hook

See the dedicated [useActivityTable documentation](./useActivityTable.md) for the full API reference, type definitions, and examples.

`useActivityTable` now wraps the base `useTable` hook, providing the same search, sort, filter, and pagination capabilities as BDO tables. Entity fields are accessed via `row.ADO.FieldName`.

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

```tsx
import { useMemo } from "react";
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import type { UseActivityFormOptions } from "@ram_28/kf-ai-sdk/workflow";
import type { FieldErrors } from "react-hook-form";
import { SimpleLeaveProcess, EmployeeInputActivity } from "@/bdo/workflows/SimpleLeaveProcess";

interface LeaveRequestFormProps {
  activityInstanceId: string;
  onComplete: () => void;
}

function LeaveRequestForm({ activityInstanceId, onComplete }: LeaveRequestFormProps) {
  // 1. Get the typed activity from the workflow
  const activity = useMemo(() => new SimpleLeaveProcess().employeeInputActivity(), []);

  // 2. Hook options
  const options: UseActivityFormOptions<EmployeeInputActivity> = {
    activity_instance_id: activityInstanceId,
    defaultValues: {
      StartDate: undefined,
      EndDate: undefined,
      LeaveType: undefined,
    },
    mode: "onBlur",
  };

  // 3. Initialize hook
  const {
    register,
    handleSubmit,
    handleComplete,
    item,
    errors,
    isLoading,
    isSubmitting,
    loadError,
  } = useActivityForm(activity, options);

  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div>Error: {loadError.message}</div>;

  // 4. Handlers
  const onSaveSuccess = (): void => {
    console.log("Saved!");
  };

  const onCompleteSuccess = (): void => {
    console.log("Leave request submitted!");
    onComplete();
  };

  const onError = (error: FieldErrors | Error): void => {
    if (error instanceof Error) {
      console.error("API Error:", error.message);
    } else {
      console.error("Validation errors:", error);
    }
  };

  return (
    <form>
      <h2>Leave Request</h2>

      {/* Start Date */}
      <div>
        <label>{activity.StartDate.meta.label}</label>
        <input type="date" {...register(activity.StartDate.meta.id)} />
        {errors.StartDate && <span>{errors.StartDate.message}</span>}
      </div>

      {/* End Date */}
      <div>
        <label>{activity.EndDate.meta.label}</label>
        <input type="date" {...register(activity.EndDate.meta.id)} />
        {errors.EndDate && <span>{errors.EndDate.message}</span>}
      </div>

      {/* Leave Type */}
      <div>
        <label>{activity.LeaveType.meta.label}</label>
        <select {...register(activity.LeaveType.meta.id)}>
          <option value="">Select type</option>
          <option value="PTO">PTO</option>
          <option value="Sick">Sick</option>
          <option value="Parental">Parental</option>
        </select>
        {errors.LeaveType && <span>{errors.LeaveType.message}</span>}
      </div>

      {/* Leave Days (readonly — auto-disabled, computed by server) */}
      <div>
        <label>{activity.LeaveDays.meta.label}</label>
        <input type="number" {...register(activity.LeaveDays.meta.id)} />
      </div>

      {/* Actions */}
      <div>
        <button type="button" onClick={handleSubmit(onSaveSuccess, onError)}>
          {isSubmitting ? "Saving..." : "Save Draft"}
        </button>
        <button type="button" onClick={handleComplete(onCompleteSuccess, onError)}>
          {isSubmitting ? "Submitting..." : "Submit Leave Request"}
        </button>
      </div>
    </form>
  );
}
```

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

  const { rows, totalItems, isLoading, error, pagination, refetch } = useActivityTable(activity, {
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
              <td>{row.ADO.ManagerApproved ? "Yes" : "No"}</td>
              <td>{row.ADO.ManagerReason}</td>
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

```tsx
import { useMemo } from "react";
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import type { UseActivityFormOptions } from "@ram_28/kf-ai-sdk/workflow";
import type { FieldErrors } from "react-hook-form";
import { SimpleLeaveProcess, ManagerApprovalActivity } from "@/bdo/workflows/SimpleLeaveProcess";

interface ApprovalFormProps {
  activityInstanceId: string;
  onComplete: () => void;
}

function ApprovalForm({ activityInstanceId, onComplete }: ApprovalFormProps) {
  const activity = useMemo(() => new SimpleLeaveProcess().managerApprovalActivity(), []);

  const options: UseActivityFormOptions<ManagerApprovalActivity> = {
    activity_instance_id: activityInstanceId,
    defaultValues: {
      ManagerApproved: false,
      ManagerReason: "",
    },
    mode: "onBlur",
  };

  const {
    register,
    handleComplete,
    errors,
    isLoading,
    isSubmitting,
    loadError,
  } = useActivityForm(activity, options);

  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div>Error: {loadError.message}</div>;

  const onSuccess = (): void => {
    console.log("Approval submitted!");
    onComplete();
  };

  const onError = (error: FieldErrors | Error): void => {
    if (error instanceof Error) console.error("API Error:", error.message);
  };

  return (
    <form>
      <h2>Leave Approval</h2>

      <div>
        <label>
          <input type="checkbox" {...register(activity.ManagerApproved.meta.id)} />
          {activity.ManagerApproved.meta.label}
        </label>
      </div>

      <div>
        <label>{activity.ManagerReason.meta.label}</label>
        <textarea {...register(activity.ManagerReason.meta.id)} rows={4} />
      </div>

      <button type="button" onClick={handleComplete(onSuccess, onError)}>
        {isSubmitting ? "Submitting..." : "Submit Decision"}
      </button>
    </form>
  );
}
```

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
console.log(instance.StartDate.meta.label);  // "Start Date"

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
