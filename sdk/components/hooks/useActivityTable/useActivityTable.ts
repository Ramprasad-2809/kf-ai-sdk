import { useMemo } from 'react';
import { useTable } from '../useTable';
import type { Activity } from '../../../workflow/Activity';
import type {
  UseActivityTableOptionsType,
  UseActivityTableReturnType,
  ActivityRowType,
} from './types';

export function useActivityTable<A extends Activity<any, any, any>>(
  options: UseActivityTableOptionsType<A>,
): UseActivityTableReturnType<A> {
  const { activity, status, ...rest } = options;
  const { businessProcessId, activityId } = activity.meta;

  const ops = useMemo(() => activity._getOps(), [activity]);

  const listFn = useMemo(
    () =>
      status === 'inprogress'
        ? (opts: any) => ops.inProgressList(opts)
        : (opts: any) => ops.completedList(opts),
    [ops, status],
  );

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
