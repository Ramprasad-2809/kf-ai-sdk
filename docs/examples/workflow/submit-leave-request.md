# Submit Leave Request

> Employee fills in dates, leave type, and reason, then submits using `useActivityForm`.

```tsx
import { useMemo } from "react";
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import type { UseActivityFormReturn } from "@ram_28/kf-ai-sdk/workflow";
import { EmployeeInputActivity } from "@/workflow/leave";

export default function LeaveRequestForm({ instanceId, onClose }: { instanceId: string; onClose: () => void }) {
  const activity = useMemo(() => new EmployeeInputActivity(), []);

  const { register, handleSubmit, errors, isLoading, isSubmitting, watch, setValue }: UseActivityFormReturn<EmployeeInputActivity> =
    useActivityForm(activity, { activity_instance_id: instanceId, mode: "onBlur" });

  if (isLoading) return <p>Loading...</p>;

  return (
    <form>
      <div>
        <label>{activity.StartDate.label} {activity.StartDate.required && <span>*</span>}</label>
        <input type="date" {...register(activity.StartDate.id)} />
        {errors.StartDate && <p>{errors.StartDate.message}</p>}
      </div>

      <div>
        <label>{activity.EndDate.label} {activity.EndDate.required && <span>*</span>}</label>
        <input type="date" {...register(activity.EndDate.id)} />
        {errors.EndDate && <p>{errors.EndDate.message}</p>}
      </div>

      {/* Select field — watch/setValue, not register */}
      <div>
        <label>{activity.LeaveType.label} {activity.LeaveType.required && <span>*</span>}</label>
        <select value={watch(activity.LeaveType.id) ?? ""} onChange={(e) => setValue(activity.LeaveType.id, e.target.value)}>
          <option value="">Select leave type</option>
          {activity.LeaveType.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {errors.LeaveType && <p>{errors.LeaveType.message}</p>}
      </div>

      <div>
        <label>{activity.Reason.label}</label>
        <textarea {...register(activity.Reason.id)} rows={3} placeholder="Reason for leave..." />
        {errors.Reason && <p>{errors.Reason.message}</p>}
      </div>

      {/* Readonly computed field — auto-disabled by register() */}
      <div>
        <label>{activity.LeaveDays.label} (computed)</label>
        <input type="number" {...register(activity.LeaveDays.id)} />
      </div>

      <button type="button" onClick={onClose}>Cancel</button>
      <button type="button" disabled={isSubmitting} onClick={handleSubmit(() => onClose(), console.error)}>
        Submit Request
      </button>
    </form>
  );
}
```

## Key Patterns

- **`useActivityForm(activity, { activity_instance_id })`** -- the instance ID comes from `workflow.start()` or a table row
- **`handleSubmit` completes the activity** -- validates, sends dirty fields, then completes to advance the workflow
- **Readonly fields auto-disabled** -- `LeaveDays` has `ReadOnly: true`, so `register()` returns `{ disabled: true }`
- **`watch()` + `setValue()` for selects** -- custom components that don't fire native change events
- **Per-field sync** -- changes are auto-saved on blur/change; no manual save button needed
