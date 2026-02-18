// ============================================================
// USE ACTIVITY TABLE HOOK
// ============================================================
// React hook for listing workflow activity instances.
// Fetches data from getInProgressList() or getCompletedList()
// and the corresponding metrics endpoint.

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { Activity } from '../../Activity';
import type { ListResponseType } from '../../../types/common';
import { toError } from '../../../utils/error-handling';

import {
  ActivityTableStatus,
  type UseActivityTableOptionsType,
  type UseActivityTableReturnType,
  type ActivityRowType,
} from './types';

// ============================================================
// MAIN HOOK
// ============================================================

export function useActivityTable<A extends Activity<any, any, any>>(
  activity: A,
  options: UseActivityTableOptionsType<A>,
): UseActivityTableReturnType<A> {
  const { status, onError, onSuccess } = options;

  const { businessProcessId, activityId } = activity.meta;

  // ============================================================
  // LIST QUERY
  // ============================================================

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['activity-table', businessProcessId, activityId, status],
    queryFn: async (): Promise<ListResponseType<ActivityRowType<A>>> => {
      try {
        const response =
          status === ActivityTableStatus.InProgress
            ? await activity.getInProgressList()
            : await activity.getCompletedList();

        if (onSuccess) {
          onSuccess(response.Data as ActivityRowType<A>[]);
        }

        return response as ListResponseType<ActivityRowType<A>>;
      } catch (err) {
        if (onError) {
          onError(toError(err));
        }
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 30 * 1000,
  });

  // ============================================================
  // METRICS QUERY (count)
  // ============================================================

  const {
    data: metricData,
    isLoading: isMetricLoading,
    isFetching: isMetricFetching,
    error: metricError,
    refetch: metricRefetch,
  } = useQuery({
    queryKey: [
      'activity-table-count',
      businessProcessId,
      activityId,
      status,
    ],
    queryFn: async () => {
      try {
        return status === ActivityTableStatus.InProgress
          ? await activity.inProgressMetrics()
          : await activity.completedMetrics();
      } catch (err) {
        if (onError) {
          onError(toError(err));
        }
        throw err;
      }
    },
    staleTime: 0,
    gcTime: 30 * 1000,
  });

  // ============================================================
  // COMPUTED VALUES
  // ============================================================

  const rows = useMemo(
    () => (data?.Data || []) as ActivityRowType<A>[],
    [data],
  );

  const totalItems = useMemo(
    () => metricData?.Data[0]?.count__id ?? 0,
    [metricData],
  );

  // ============================================================
  // REFETCH
  // ============================================================

  const refetch = useCallback(async (): Promise<
    ListResponseType<ActivityRowType<A>>
  > => {
    const [listResult] = await Promise.all([queryRefetch(), metricRefetch()]);
    return (listResult.data || { Data: [] }) as ListResponseType<
      ActivityRowType<A>
    >;
  }, [queryRefetch, metricRefetch]);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    rows,
    totalItems,
    isLoading: isLoading || isMetricLoading,
    isFetching: isFetching || isMetricFetching,
    error: error
      ? toError(error)
      : metricError
        ? toError(metricError)
        : null,
    refetch,
  };
}
