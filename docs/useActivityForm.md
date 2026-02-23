# useActivityForm

React hook for building forms bound to workflow activity input fields. Integrates with `react-hook-form`.

## Imports

```typescript
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import type {
  UseActivityFormOptions,
  UseActivityFormReturn,
} from "@ram_28/kf-ai-sdk/workflow";
import type { FieldErrors } from "react-hook-form";
```

---

## Common Mistakes (READ FIRST)

### 1. Passing a Workflow instead of an Activity

`useActivityForm` takes an **Activity** instance, not a Workflow.

```typescript
// ❌ WRONG — passing a workflow
const wf = new SimpleLeaveProcess();
useActivityForm(wf, options);

// ✅ CORRECT — get the typed activity from the workflow
const activity = useMemo(() => new SimpleLeaveProcess().employeeInputActivity(), []);
useActivityForm(activity, options);
```

### 2. Forgetting to memoize the activity instance

Activity instances must be stable across renders, or the hook will re-fetch metadata on every render.

```typescript
// ❌ WRONG — new instance on every render
const activity = new SimpleLeaveProcess().employeeInputActivity();
useActivityForm(activity, options);

// ✅ CORRECT — memoize with useMemo
const activity = useMemo(() => new SimpleLeaveProcess().employeeInputActivity(), []);
useActivityForm(activity, options);
```

### 3. Using handleSubmit instead of handleComplete to finish an activity

`handleSubmit` saves the form data but does NOT complete the activity. Use `handleComplete` to save AND complete.

```typescript
// ❌ WRONG — only saves, does not complete
<button onClick={handleSubmit(onSuccess, onError)}>Submit Leave Request</button>

// ✅ CORRECT — saves AND completes the activity
<button onClick={handleComplete(onSuccess, onError)}>Submit Leave Request</button>

// ✅ ALSO CORRECT — save as draft (intentionally not completing)
<button onClick={handleSubmit(onSaveSuccess, onError)}>Save Draft</button>
```

### 4. Calling `.get()` on form item fields

Form item fields from `useActivityForm` follow the same accessor pattern as `useBDOForm`. Use `.get()` to read values programmatically, but prefer `watch()` for rendering.

```tsx
// ❌ WRONG — renders [object Object]
<span>{item.StartDate}</span>

// ✅ CORRECT — use .get() for programmatic access
const startDate = item.StartDate.get();

// ✅ CORRECT — use watch() for reactive rendering in JSX
<span>{watch(activity.StartDate.id)}</span>
```

---

## Type Definitions

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

## handleSubmit vs handleComplete

| | `handleSubmit` | `handleComplete` |
|---|---|---|
| **Saves dirty fields** | Yes | Yes |
| **Completes the activity** | No | Yes |
| **Use case** | Save draft / intermediate save | Final submission |

Both validate the form before executing. Both only send dirty (changed) fields to the API.

---

## Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activity_instance_id` | `string` | *required* | Activity instance ID (from `wf.start()` or `getInProgressList()`) |
| `defaultValues` | `Partial<Editable>` | `{}` | Initial form values |
| `mode` | `"onBlur" \| "onChange" \| "onSubmit" \| "onTouched" \| "all"` | `"onBlur"` | Validation timing |
| `enabled` | `boolean` | `true` | Whether to load activity data on mount |

## Lifecycle

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

## Return Value

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

## Example: Employee Leave Request Form

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
        <label>{activity.StartDate.label}</label>
        <input type="date" {...register(activity.StartDate.id)} />
        {errors.StartDate && <span>{errors.StartDate.message}</span>}
      </div>

      {/* End Date */}
      <div>
        <label>{activity.EndDate.label}</label>
        <input type="date" {...register(activity.EndDate.id)} />
        {errors.EndDate && <span>{errors.EndDate.message}</span>}
      </div>

      {/* Leave Type */}
      <div>
        <label>{activity.LeaveType.label}</label>
        <select {...register(activity.LeaveType.id)}>
          <option value="">Select type</option>
          <option value="PTO">PTO</option>
          <option value="Sick">Sick</option>
          <option value="Parental">Parental</option>
        </select>
        {errors.LeaveType && <span>{errors.LeaveType.message}</span>}
      </div>

      {/* Leave Days (readonly — auto-disabled, computed by server) */}
      <div>
        <label>{activity.LeaveDays.label}</label>
        <input type="number" {...register(activity.LeaveDays.id)} />
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

---

## Example: Manager Approval Form

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
          <input type="checkbox" {...register(activity.ManagerApproved.id)} />
          {activity.ManagerApproved.label}
        </label>
      </div>

      <div>
        <label>{activity.ManagerReason.label}</label>
        <textarea {...register(activity.ManagerReason.id)} rows={4} />
      </div>

      <button type="button" onClick={handleComplete(onSuccess, onError)}>
        {isSubmitting ? "Submitting..." : "Submit Decision"}
      </button>
    </form>
  );
}
```
