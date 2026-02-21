import type { Activity } from '../../../workflow/Activity';
import type { ActivityInstanceFieldsType } from '../../../workflow/types';
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
 * Row type for activity table data.
 * System fields at top level, entity fields under ADO.
 */
export type ActivityRowType<A extends Activity<any, any, any>> =
  A extends Activity<infer E, any, any>
    ? ActivityInstanceFieldsType & { ADO: E }
    : never;

export interface UseActivityTableOptionsType<
  A extends Activity<any, any, any>,
> {
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
