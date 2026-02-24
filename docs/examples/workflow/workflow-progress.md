# Workflow Progress

> Display progress badges for each activity in a workflow instance using `workflow.progress()`.

```tsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Workflow } from "@ram_28/kf-ai-sdk/workflow";
import type { ActivityProgressType } from "@ram_28/kf-ai-sdk/workflow";
import type { EmployeeInputEntityType } from "@/workflow/leave";

export default function WorkflowProgressBadges({ bpInstanceId }: { bpInstanceId: string }) {
  const workflow = useMemo(() => new Workflow<EmployeeInputEntityType>("SimpleLeaveProcess"), []);

  const { data: progress } = useQuery<ActivityProgressType[]>({
    queryKey: ["workflow-progress", bpInstanceId],
    queryFn: () => workflow.progress(bpInstanceId),
    staleTime: 0,
  });

  if (!progress) return null;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {progress.map((entry: ActivityProgressType) => (
        <span
          key={entry.ActivityId}
          style={{
            padding: "4px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            backgroundColor: entry.Status === "COMPLETED" ? "#dcfce7" : "#fef9c3",
            color: entry.Status === "COMPLETED" ? "#166534" : "#854d0e",
          }}
        >
          {entry._name} — {entry.Status === "COMPLETED" ? "Done" : "In Progress"}
        </span>
      ))}
    </div>
  );
}
```

## Key Patterns

- **`workflow.progress(bpInstanceId)`** -- returns `ActivityProgressType[]`, one entry per activity in the process
- **`ActivityProgressType`** -- each entry has `ActivityId`, `_name`, `Status` (`"COMPLETED"` or `"IN_PROGRESS"`), `CompletedAt`, `CompletedBy`
- **`BPInstanceId`** -- comes from `workflow.start()` (new requests) or `row.BPInstanceId.get()` (existing table rows)
- **`staleTime: 0`** -- always refetch progress when the component mounts (progress changes as activities complete)
