import { api } from '../../../api/client';
import { useTable } from '../useTable';
import type { UseBDOTableOptionsType, UseBDOTableReturnType } from './types';

export function useBDOTable<T = any>(
  options: UseBDOTableOptionsType<T>,
): UseBDOTableReturnType<T> {
  const { bdo, ...rest } = options;

  return useTable<T>({
    queryKey: ['table', bdo.meta._id],
    listFn: (opts) => api<T>(bdo.meta._id).list(opts),
    countFn: (opts) => api<T>(bdo.meta._id).count(opts),
    ...rest,
  });
}
