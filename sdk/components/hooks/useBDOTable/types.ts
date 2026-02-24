import type { ListOptionsType, SortType } from '../../../types/common';
import type { UseTableReturnType, PaginationStateType } from '../useTable/types';
import type { UseFilterOptionsType } from '../useFilter/types';

/** Structural constraint — any object with list() and count() */
export interface BDOTableSourceType {
  meta: { readonly _id: string; readonly name: string };
  list(options?: ListOptionsType): Promise<any[]>;
  count(options?: ListOptionsType): Promise<number>;
}

/** Infer row type from BDO's list() return type */
export type BDORowType<B extends BDOTableSourceType> =
  B extends { list(opts?: any): Promise<(infer R)[]> } ? R : never;

export interface UseBDOTableOptionsType<B extends BDOTableSourceType> {
  /** BDO instance — list() and count() are called for data */
  bdo: B;
  /** Initial state */
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<BDORowType<B>>;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback — receives Item rows from current page */
  onSuccess?: (data: BDORowType<B>[]) => void;
}

export type UseBDOTableReturnType<B extends BDOTableSourceType> =
  UseTableReturnType<BDORowType<B>>;
