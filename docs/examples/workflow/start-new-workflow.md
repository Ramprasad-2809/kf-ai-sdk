# Start New Workflow

> "New Request" button calls `workflow.start()` and opens the form with the returned instance ID.

```tsx
import { useState, useMemo, useCallback } from "react";
import { Workflow } from "@ram_28/kf-ai-sdk/workflow";
import type { WorkflowStartResponseType } from "@ram_28/kf-ai-sdk/workflow";
import type { EmployeeInputEntityType } from "@/workflow/leave";

export default function StartNewWorkflow({ onOpenForm }: { onOpenForm: (instanceId: string, bpInstanceId: string) => void }) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflow = useMemo(() => new Workflow<EmployeeInputEntityType>("SimpleLeaveProcess"), []);

  const handleNewRequest = useCallback(async () => {
    try {
      setIsStarting(true);
      setError(null);
      const result: WorkflowStartResponseType = await workflow.start();
      // result: { BPInstanceId, ActivityId, _id }
      onOpenForm(result._id, result.BPInstanceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start workflow");
    } finally {
      setIsStarting(false);
    }
  }, [workflow, onOpenForm]);

  return (
    <div>
      <button onClick={handleNewRequest} disabled={isStarting}>
        {isStarting ? "Starting..." : "New Request"}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

## Key Patterns

- **`workflow.start()`** -- creates a new process instance and returns `{ BPInstanceId, ActivityId, _id }`
- **`BPInstanceId`** -- identifies the workflow instance; used for `workflow.progress()`
- **`_id`** -- the first activity instance ID; passed to `useActivityForm` as `activity_instance_id`
- **Workflow constructor** -- `new Workflow<TEntity>("BusinessProcessId")` takes the process ID string
