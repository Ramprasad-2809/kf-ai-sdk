import type { UseTableReturnType, PaginationStateType } from '../useTable/types';
import type { UseFilterOptionsType } from '../useFilter/types';
import type { SortType } from '../../../types/common';

export interface UseBDOTableOptionsType<T> {
  /** BDO instance — only meta._id is used (for API routing) */
  bdo: {
    meta: { readonly _id: string; readonly name: string };
  };
  /** Initial state */
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<T>;
  };
  /** Error callback */
  onError?: (error: Error) => void;
  /** Success callback — receives rows from current page */
  onSuccess?: (data: T[]) => void;
}

export type UseBDOTableReturnType<T> = UseTableReturnType<T>;
