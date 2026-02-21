import { useMemo } from 'react';
import { useTable } from '../useTable';
import type { Activity } from '../../../workflow/Activity';
import type {
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityRowType,
} from './types';

const ACTIVITY_SYSTEM_FIELDS = new Set([
  '_id',
  'BPInstanceId',
  'Status',
  'AssignedTo',
  'CompletedAt',
]);

function nestEntityFields(
  flatRow: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const ado: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flatRow)) {
    if (ACTIVITY_SYSTEM_FIELDS.has(key)) {
      result[key] = value;
    } else {
      ado[key] = value;
    }
  }
  result.ADO = ado;
  return result;
}

export function useActivityTable<A extends Activity<any, any, any>>(
  activity: A,
  options: UseActivityTableOptionsType<A>,
): UseActivityTableReturnType<A> {
  const { status, ...rest } = options;
  const { businessProcessId, activityId } = activity.meta;

  const ops = useMemo(() => activity._getOps(), [activity]);

  const listFn = useMemo(() => {
    const rawFn =
      status === 'inprogress'
        ? (opts: any) => ops.inProgressList(opts)
        : (opts: any) => ops.completedList(opts);
    return async (opts: any) => {
      const result = await rawFn(opts);
      return {
        ...result,
        Data: result.Data.map(nestEntityFields),
      } as typeof result;
    };
  }, [ops, status]);

  const countFn = useMemo(
    () =>
      status === 'inprogress'
        ? (opts: any) => ops.inProgressMetric(opts)
        : (opts: any) => ops.completedMetric(opts),
    [ops, status],
  );

  return useTable<ActivityRowType<A>>({
    queryKey: ['activity-table', businessProcessId, activityId, status],
    listFn,
    countFn,
    ...rest,
  });
}
