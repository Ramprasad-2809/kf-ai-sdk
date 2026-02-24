```typescript
import { Activity, Workflow } from "@ram_28/kf-ai-sdk/workflow";
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import type {
  WorkflowStartResponseType,
  ActivityProgressType,
  ActivityInstanceFieldsType,
  ActivityTableStatusType,
} from "@ram_28/kf-ai-sdk/workflow";
import type {
  ListOptionsType,
  CreateUpdateResponseType,
  MetricOptionsType,
  MetricResponseType,
} from "@ram_28/kf-ai-sdk/api/types";
import type { ValidationResultType } from "@ram_28/kf-ai-sdk/bdo/types";
```

## Workflow Methods

| Method | Params | Returns |
|--------|--------|---------|
| `start()` | — | `Promise<WorkflowStartResponseType>` |
| `progress(instanceId)` | `instance_id: string` (pass `BPInstanceId`) | `Promise<ActivityProgressType[]>` |

## Activity Methods

| Method | Params | Returns |
|--------|--------|---------|
| `getInstance(id)` | `instanceId: string` | `Promise<ActivityInstanceType<TEntity, TEditable, TReadonly>>` |
| `getInProgressList(options?)` | `options?: ListOptionsType` | `Promise<ActivityInstanceType<...>[]>` |
| `getCompletedList(options?)` | `options?: ListOptionsType` | `Promise<ActivityInstanceType<...>[]>` |
| `inProgressCount(options?)` | `options?: ListOptionsType` | `Promise<number>` |
| `completedCount(options?)` | `options?: ListOptionsType` | `Promise<number>` |
| `inProgressMetric(options)` | `options: Omit<MetricOptionsType, "Type">` | `Promise<MetricResponseType>` |
| `completedMetric(options)` | `options: Omit<MetricOptionsType, "Type">` | `Promise<MetricResponseType>` |

## ActivityInstance Methods

| Method | Params | Returns |
|--------|--------|---------|
| `update(data)` | `data: Partial<TEditable>` | `Promise<CreateUpdateResponseType>` |
| `complete()` | — | `Promise<CreateUpdateResponseType>` |
| `save(data)` | `data: Partial<TEditable>` | `Promise<CreateUpdateResponseType>` |
| `progress()` | — | `Promise<ActivityProgressType[]>` |
| `toJSON()` | — | `Partial<TEntity>` |
| `validate()` | — | `ValidationResultType` |

ActivityInstance field accessors follow the same pattern as BDO `ItemType` — see [BDO API Reference](../bdo/api_reference.md#editablefieldaccessortypet) for `EditableFieldAccessorType` and `ReadonlyFieldAccessorType`.

## Types

### WorkflowStartResponseType

```typescript
interface WorkflowStartResponseType {
  BPInstanceId: string;   // business process instance ID — pass to progress()
  ActivityId: string;     // first activity's ID
  _id: string;            // first activity instance ID — pass to getInstance()
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

### ActivityInstanceType\<TEntity, TEditable, TReadonly\>

Proxy-wrapped activity instance. Same accessor pattern as BDO `ItemType`.

```typescript
type ActivityInstanceType<TEntity, TEditable, TReadonly> = {
  readonly _id: string;

  // Editable fields → EditableFieldAccessorType<T> (get/set/validate)
  // Readonly fields → ReadonlyFieldAccessorType<T> (get/validate, no set)

  update(data: Partial<TEditable>): Promise<CreateUpdateResponseType>;
  complete(): Promise<CreateUpdateResponseType>;
  save(data: Partial<TEditable>): Promise<CreateUpdateResponseType>;
  progress(): Promise<ActivityProgressType[]>;
  toJSON(): Partial<TEntity>;
  validate(): ValidationResultType;
};
```

### ActivityInstanceFieldsType

System fields present on every activity instance record.

```typescript
type ActivityInstanceFieldsType = {
  _id: StringFieldType;
  BPInstanceId: StringFieldType;
  Status: SelectFieldType<"InProgress" | "Completed">;
  AssignedTo: UserFieldType[];
  CompletedAt: DateTimeFieldType;
};
```

### ActivityTableStatus

Constants for the `useActivityTable` status parameter.

```typescript
const ActivityTableStatus = {
  InProgress: "inprogress",
  Completed: "completed",
} as const;

type ActivityTableStatusType =
  (typeof ActivityTableStatus)[keyof typeof ActivityTableStatus];
```

### ListOptionsType

Same type as BDO — see [BDO API Reference](../bdo/api_reference.md#listoptionstype).

```typescript
interface ListOptionsType {
  Filter?: FilterType;
  Sort?: SortType;
  Page?: number;       // 1-indexed
  PageSize?: number;
  Search?: string;
  Field?: string[];
}
```

### Generated Type Patterns

The js_sdk generator creates these types per activity:

```typescript
// workflow/EmployeeInputActivity.ts
type LeaveEntityType = {
  StartDate: DateFieldType;
  EndDate: DateFieldType;
  LeaveType: StringFieldType;
  LeaveDays: NumberFieldType;
};
type LeaveEditableFieldType = Pick<LeaveEntityType, "StartDate" | "EndDate" | "LeaveType">;
type LeaveReadonlyFieldType = Pick<LeaveEntityType, "LeaveDays">;

class EmployeeInputActivity extends Activity<LeaveEntityType, LeaveEditableFieldType, LeaveReadonlyFieldType> {
  readonly meta = { businessProcessId: "SimpleLeaveProcess", activityId: "EMPLOYEE_INPUT" } as const;
  // ... field declarations
}
```
