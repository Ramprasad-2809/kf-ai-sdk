# Approve Leave Request

> Manager reviews readonly employee data and approves/rejects using `useActivityForm`.

```tsx
import { useMemo } from "react";
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import type { UseActivityFormReturn } from "@ram_28/kf-ai-sdk/workflow";
import { ManagerApprovalActivity } from "@/workflow/leave";

export default function ApprovalForm({ instanceId, onClose }: { instanceId: string; onClose: () => void }) {
  const activity = useMemo(() => new ManagerApprovalActivity(), []);

  const { register, handleSubmit, errors, isLoading, isSubmitting, watch, setValue }: UseActivityFormReturn<ManagerApprovalActivity> =
    useActivityForm(activity, { activity_instance_id: instanceId, mode: "onBlur" });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      {/* Readonly context fields — auto-disabled by register() */}
      <div>
        <label>{activity.EmployeeName.label}</label>
        <input {...register(activity.EmployeeName.id)} className="bg-gray-100" />
      </div>
      <div>
        <label>{activity.StartDate.label}</label>
        <input type="date" {...register(activity.StartDate.id)} className="bg-gray-100" />
      </div>
      <div>
        <label>{activity.EndDate.label}</label>
        <input type="date" {...register(activity.EndDate.id)} className="bg-gray-100" />
      </div>
      <div>
        <label>{activity.LeaveDays.label}</label>
        <input type="number" {...register(activity.LeaveDays.id)} className="bg-gray-100" />
      </div>

      <hr />

      {/* Editable manager decision fields */}
      <div>
        <input
          type="checkbox"
          checked={watch(activity.ManagerApproved.id) ?? false}
          onChange={(e) => setValue(activity.ManagerApproved.id, e.target.checked)}
        />
        <label>
          {activity.ManagerApproved.label}
          {activity.ManagerApproved.required && <span> *</span>}
        </label>
        {errors.ManagerApproved && <p>{errors.ManagerApproved.message}</p>}
      </div>

      <div>
        <label>{activity.ManagerReason.label}</label>
        <textarea {...register(activity.ManagerReason.id)} rows={3} placeholder="Reason for approval or rejection..." />
        {errors.ManagerReason && <p>{errors.ManagerReason.message}</p>}
      </div>

      <button onClick={onClose}>Cancel</button>
      <button disabled={isSubmitting} onClick={handleSubmit(() => onClose(), console.error)}>
        {watch(activity.ManagerApproved.id) ? "Approve" : "Reject"} & Submit
      </button>
    </div>
  );
}
```

## Key Patterns

- **Readonly context fields** -- fields from the prior employee activity have `ReadOnly: true` and are auto-disabled by `register()`
- **Editable decision fields** -- `ManagerApproved` and `ManagerReason` are the only editable fields
- **Checkbox with `watch()` + `setValue()`** -- booleans use `e.target.checked`, not `e.target.value`
- **Dynamic submit label** -- `watch(activity.ManagerApproved.id)` drives the button text
- **`handleSubmit` completes the approval** -- validates, syncs remaining fields, then completes the activity
