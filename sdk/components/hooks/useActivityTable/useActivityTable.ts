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

  const listFn = useMemo(
    () =>
      status === 'inprogress'
        ? async (opts: any) => ({
            Data: (await activity.getInProgressList(opts)) as ActivityRowType<A>[],
          })
        : async (opts: any) => ({
            Data: (await activity.getCompletedList(opts)) as ActivityRowType<A>[],
          }),
    [activity, status],
  );

  const countFn = useMemo(
    () =>
      status === 'inprogress'
        ? async (opts: any) => ({ Count: await activity.inProgressCount(opts) })
        : async (opts: any) => ({ Count: await activity.completedCount(opts) }),
    [activity, status],
  );

  return useTable<ActivityRowType<A>>({
    queryKey: ['activity-table', businessProcessId, activityId, status],
    listFn,
    countFn,
    ...rest,
  });
}
