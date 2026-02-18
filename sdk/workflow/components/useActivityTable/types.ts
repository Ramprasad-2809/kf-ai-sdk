// ============================================================
// TYPE DEFINITIONS FOR useActivityTable HOOK
// ============================================================

import type { Activity } from '../../Activity';
import type { ActivityInstanceFieldsType } from '../../types';
import type { ExtractActivityEntity } from '../useActivityForm/types';
import type { ListResponseType } from '../../../types/common';

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
 * Combines activity instance system fields with entity-specific fields.
 *
 * For a ManagerApprovalActivity with { ManagerApproved, ManagerReason }:
 * ActivityRowType resolves to:
 *   {
 *     // System fields (ActivityInstanceFieldsType)
 *     _id: string;
 *     Status: "InProgress" | "Completed";
 *     AssignedTo: UserRefType;
 *     CompletedAt: string;
 *     // Entity fields
 *     ManagerApproved: boolean;
 *     ManagerReason: string;
 *   }
 */
export type ActivityRowType<A extends Activity<any, any, any>> =
  ActivityInstanceFieldsType & ExtractActivityEntity<A>;

export interface UseActivityTableOptionsType<
  A extends Activity<any, any, any>,
> {
  /** Which activity instances to fetch */
  status: ActivityTableStatusType;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback with row data */
  onSuccess?: (data: ActivityRowType<A>[]) => void;
}

export interface UseActivityTableReturnType<
  A extends Activity<any, any, any>,
> {
  /** Activity instance records (system fields + entity fields) */
  rows: ActivityRowType<A>[];
  /** Total count from metrics endpoint */
  totalItems: number;
  /** Initial load in progress */
  isLoading: boolean;
  /** Any fetch in progress (including refetch) */
  isFetching: boolean;
  /** Fetch error */
  error: Error | null;
  /** Refetch both list and metrics */
  refetch: () => Promise<ListResponseType<ActivityRowType<A>>>;
}
