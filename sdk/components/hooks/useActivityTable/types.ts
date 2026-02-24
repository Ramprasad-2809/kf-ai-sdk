import type { Activity } from '../../../workflow/Activity';
import type { UseTableReturnType, PaginationStateType } from '../useTable/types';
import type { UseFilterOptionsType } from '../useFilter/types';
import type { SortType } from '../../../types/common';

/**
 * Activity table status — determines which API to call
 */
export const ActivityTableStatus = {
  InProgress: 'inprogress',
  Completed: 'completed',
} as const;

export type ActivityTableStatusType =
  (typeof ActivityTableStatus)[keyof typeof ActivityTableStatus];

/**
 * Row type — inferred from Activity's getInProgressList() return type.
 * Resolves to ActivityInstanceType (proxy with .get()/.set()).
 */
export type ActivityRowType<A extends Activity<any, any, any>> =
  A extends { getInProgressList(opts?: any): Promise<(infer R)[]> }
    ? R
    : never;

export interface UseActivityTableOptionsType<
  A extends Activity<any, any, any>,
> {
  /** The activity instance to fetch data for */
  activity: A;
  /** Which operation — determines endpoint (inprogress vs completed) */
  status: ActivityTableStatusType;
  /** Initial state */
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<ActivityRowType<A>>;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback with row data */
  onSuccess?: (data: ActivityRowType<A>[]) => void;
}

export type UseActivityTableReturnType<A extends Activity<any, any, any>> =
  UseTableReturnType<ActivityRowType<A>>;
