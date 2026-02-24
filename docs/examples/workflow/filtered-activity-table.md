# Filtered Activity Table

> Filter activity instances by date range using `useActivityTable` with the integrated `table.filter` API.

```tsx
import { useState, useMemo } from "react";
import { useActivityTable, ActivityTableStatus } from "@ram_28/kf-ai-sdk/workflow";
import type { UseActivityTableReturnType } from "@ram_28/kf-ai-sdk/workflow";
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
import { EmployeeInputActivity } from "@/workflow/leave";

export default function FilteredActivityTable() {
  const activity = useMemo(() => new EmployeeInputActivity(), []);
  const table: UseActivityTableReturnType<EmployeeInputActivity> = useActivityTable({ activity, status: ActivityTableStatus.InProgress });

  // ── Date range filter on StartDate ─────────────────────────────
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [fromConditionId, setFromConditionId] = useState<string | null>(null);
  const [toConditionId, setToConditionId] = useState<string | null>(null);

  const applyDateFilter = () => {
    if (fromConditionId) { table.filter.removeCondition(fromConditionId); setFromConditionId(null); }
    if (toConditionId) { table.filter.removeCondition(toConditionId); setToConditionId(null); }

    if (startDateFrom) {
      const id = table.filter.addCondition({
        LHSField: activity.StartDate.id,
        Operator: ConditionOperator.GTE,
        RHSType: RHSType.Constant,
        RHSValue: startDateFrom,
      });
      setFromConditionId(id);
    }
    if (startDateTo) {
      const id = table.filter.addCondition({
        LHSField: activity.StartDate.id,
        Operator: ConditionOperator.LTE,
        RHSType: RHSType.Constant,
        RHSValue: startDateTo,
      });
      setToConditionId(id);
    }
  };

  const clearDateFilter = () => {
    if (fromConditionId) { table.filter.removeCondition(fromConditionId); setFromConditionId(null); }
    if (toConditionId) { table.filter.removeCondition(toConditionId); setToConditionId(null); }
    setStartDateFrom("");
    setStartDateTo("");
  };

  if (table.isLoading) return <p>Loading...</p>;

  return (
    <div>
      {/* Date range filter */}
      <div>
        <label>From</label>
        <input type="date" value={startDateFrom} onChange={(e) => setStartDateFrom(e.target.value)} />
        <label>To</label>
        <input type="date" value={startDateTo} onChange={(e) => setStartDateTo(e.target.value)} />
        <button onClick={applyDateFilter}>Apply</button>
        {table.filter.hasConditions && <button onClick={clearDateFilter}>Clear</button>}
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>{activity.StartDate.label}</th>
            <th>{activity.EndDate.label}</th>
            <th>{activity.LeaveType.label}</th>
            <th>{activity.LeaveDays.label}</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row._id}>
              <td>{row.StartDate.get()}</td>
              <td>{row.EndDate.get()}</td>
              <td>{row.LeaveType.get()}</td>
              <td>{row.LeaveDays.get()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <span>Page {table.pagination.pageNo} of {table.pagination.totalPages}</span>
    </div>
  );
}
```

## Key Patterns

- **Date range with GTE + LTE** -- two separate conditions tracked by their own IDs
- **`addCondition()` returns an ID** -- store it to later remove the condition with `removeCondition(id)`
- **`table.filter.hasConditions`** -- show a "Clear" button only when filters are active
- **Filter changes auto-reset pagination** -- the table resets to page 1 when conditions change
- **Same filter API as `useBDOTable`** -- `table.filter` works identically in both BDO and Activity tables
