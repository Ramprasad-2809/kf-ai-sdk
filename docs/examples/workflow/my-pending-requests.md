# My Pending Requests

> Employee views leave requests in In Progress / Completed tabs using `useActivityTable`.

```tsx
import { useState, useMemo } from "react";
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import type { UseActivityTableReturnType } from "@ram_28/kf-ai-sdk/workflow";
import { EmployeeInputActivity } from "@/workflow/leave";

export default function MyPendingRequests({ onOpenForm }: { onOpenForm: (instanceId: string, bpInstanceId: string) => void }) {
  const [status, setStatus] = useState(ActivityTableStatus.InProgress);
  const activity = useMemo(() => new EmployeeInputActivity(), []);

  const table: UseActivityTableReturnType<EmployeeInputActivity> = useActivityTable({
    activity,
    status,
    initialState: { sort: [{ StartDate: "DESC" }], pagination: { pageNo: 1, pageSize: 10 } },
  });

  if (table.isLoading) return <p>Loading...</p>;
  if (table.error) return <p>Error: {table.error.message}</p>;

  return (
    <div>
      {/* Tab switcher */}
      <div>
        <button onClick={() => setStatus(ActivityTableStatus.InProgress)}
          style={{ fontWeight: status === ActivityTableStatus.InProgress ? "bold" : "normal" }}>
          My Requests
        </button>
        <button onClick={() => setStatus(ActivityTableStatus.Completed)}
          style={{ fontWeight: status === ActivityTableStatus.Completed ? "bold" : "normal" }}>
          Completed
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => table.sort.toggle(activity.StartDate.id)} style={{ cursor: "pointer" }}>
              {activity.StartDate.label}
            </th>
            <th>{activity.EndDate.label}</th>
            <th>{activity.LeaveType.label}</th>
            <th>{activity.LeaveDays.label}</th>
            <th>Status</th>
            {status === ActivityTableStatus.Completed && <th>Completed At</th>}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr
              key={row._id}
              style={{ cursor: status === ActivityTableStatus.InProgress ? "pointer" : "default" }}
              onClick={() => {
                if (status === ActivityTableStatus.InProgress) {
                  onOpenForm(row._id, row.BPInstanceId.get());
                }
              }}
            >
              <td>{row.StartDate.get()}</td>
              <td>{row.EndDate.get()}</td>
              <td>{row.LeaveType.get()}</td>
              <td>{row.LeaveDays.get()}</td>
              <td>{row.Status.get()}</td>
              {status === ActivityTableStatus.Completed && <td>{row.CompletedAt.get()}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button onClick={table.pagination.goToPrevious} disabled={!table.pagination.canGoPrevious}>Previous</button>
        <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
        <button onClick={table.pagination.goToNext} disabled={!table.pagination.canGoNext}>Next</button>
      </div>
    </div>
  );
}
```

## Key Patterns

- **`ActivityTableStatus.InProgress` / `Completed`** -- changing `status` state triggers an automatic refetch
- **Activity system fields** -- `row.Status.get()`, `row.CompletedAt.get()`, `row.BPInstanceId.get()` are available on every row
- **Conditional `CompletedAt` column** -- only rendered in the Completed tab
- **Clickable rows only in InProgress** -- completed rows are read-only and don't open a form dialog
- **`row.BPInstanceId.get()`** -- passed along when opening a form, needed for workflow progress tracking
