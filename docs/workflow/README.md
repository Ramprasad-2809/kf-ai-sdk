# Workflow

Business process orchestration with typed Activity classes and a Workflow wrapper. Activity classes use the same three-generics pattern as BDO (`Activity<TEntity, TEditable, TReadonly>`), and a Workflow class ties multiple activities into a process.

## Imports

```typescript
// Page component — import the generated workflow and activity classes, plus hooks
import { LeaveProcess } from "../workflow/LeaveProcess";
import { EmployeeInputActivity } from "../workflow/EmployeeInputActivity";
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
```

```typescript
// Workflow class definition — used by the js_sdk generator
import { Activity, Workflow } from "@ram_28/kf-ai-sdk/workflow";
import type { WorkflowStartResponseType, ActivityProgressType } from "@ram_28/kf-ai-sdk/workflow";
```

Field classes and field value types are imported from `@ram_28/kf-ai-sdk/bdo` and `@ram_28/kf-ai-sdk/types`, same as BDO.

## Common Mistakes (READ FIRST)

1. **`BPInstanceId` vs `_id`** — `start()` returns both. `BPInstanceId` is for `progress()`. `_id` is the first activity instance ID for `getInstance()`.
2. **`complete()` does not save** — `complete()` only marks the activity done and advances the workflow. Call `update()` first to persist field changes, then `complete()`.
3. **No single `list()` method** — Use `getInProgressList()` or `getCompletedList()`. The backend filters by status automatically.
4. **Memoize Activity instances in React** — Wrap in `useMemo` to prevent re-creation on every render:
   ```typescript
   const activity = useMemo(() => new EmployeeInputActivity(), []);
   ```

## Quick Start

```typescript
const leaveProcess = new LeaveProcess();
const employeeInput = new EmployeeInputActivity();

// Start workflow — returns { BPInstanceId, ActivityId, _id }
const { BPInstanceId, _id } = await leaveProcess.start();

// Get the first activity instance
const instance = await employeeInput.getInstance(_id);
instance.StartDate.get();  // read field value

// Update fields, then complete
await instance.update({ StartDate: "2026-04-01", EndDate: "2026-04-05", LeaveType: "PTO" });
await instance.complete();

// Check workflow progress
const stages = await leaveProcess.progress(BPInstanceId);
// [{ ActivityId: "EMPLOYEE_INPUT", Status: "COMPLETED" }, { ActivityId: "MANAGER_APPROVAL", Status: "IN_PROGRESS" }]
```

## Usage Guide

### Workflow Methods

The Workflow class is a thin wrapper — `start()` and `progress()` only.

```typescript
const leaveProcess = new LeaveProcess();

// Start a new instance
const { BPInstanceId, ActivityId, _id } = await leaveProcess.start();

// Get progress for all stages (pass BPInstanceId, not _id)
const stages = await leaveProcess.progress(BPInstanceId);
stages.forEach((s) => console.log(s.ActivityId, s.Status));
```

### Activity Methods

```typescript
const activity = new EmployeeInputActivity();

// List instances by status
const inProgress = await activity.getInProgressList({ Page: 1, PageSize: 10 });
const completed = await activity.getCompletedList({ Page: 1, PageSize: 10 });

// Count
const pendingCount = await activity.inProgressCount();
const doneCount = await activity.completedCount();

// Metrics
const result = await activity.inProgressMetric({
  GroupBy: ["LeaveType"],
  Metric: [{ Field: "LeaveDays", Type: "Sum" }],
});

// Get single instance
const instance = await activity.getInstance("instance_id");
```

### ActivityInstance Field Accessors

Same accessor pattern as BDO `ItemType`.

```typescript
const instance = await activity.getInstance(_id);

// Read values
instance._id;                        // string (direct)
instance.StartDate.get();            // DateFieldType | undefined
instance.LeaveDays.getOrDefault(0);  // number (never undefined)

// Write values (editable fields only)
instance.StartDate.set("2026-04-01");

// Field metadata
instance.StartDate.label;     // "Start Date"
instance.StartDate.required;  // true
instance.StartDate.readOnly;  // false

// Validation
instance.StartDate.validate(); // { valid, errors }
instance.validate();           // validates all fields

// Serialize
instance.toJSON();             // { StartDate: "2026-04-01", ... }
```

### Persistence: update, save, complete

```typescript
const instance = await activity.getInstance(_id);

// update() — persists field changes
await instance.update({ StartDate: "2026-04-01", EndDate: "2026-04-05" });

// save() — commits a draft (used by useActivityForm internally)
await instance.save({ StartDate: "2026-04-01" });

// complete() — marks activity done, advances workflow (does NOT auto-save)
await instance.complete();

// progress() — get workflow progress from this instance
const stages = await instance.progress();
```

### Progress Tracking

```typescript
const stages = await leaveProcess.progress(BPInstanceId);

for (const stage of stages) {
  console.log(stage.ActivityId);   // "EMPLOYEE_INPUT"
  console.log(stage.Status);      // "COMPLETED" | "IN_PROGRESS"
  console.log(stage.CompletedAt); // string | null
  console.log(stage.CompletedBy); // { _id, _name } | null
}
```

## Further Reading

- [API Reference](./api_reference.md) — full method signatures, parameter types, and return types
- [Start New Workflow](../examples/workflow/start-new-workflow.md) — `workflow.start()` flow
- [Workflow Progress](../examples/workflow/workflow-progress.md) — progress badges for activity stages
