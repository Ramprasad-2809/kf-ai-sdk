import { useTable } from '../useTable';
import type { UseBDOTableOptionsType, UseBDOTableReturnType } from './types';

export function useBDOTable<T = any>(
  options: UseBDOTableOptionsType<T>,
): UseBDOTableReturnType<T> {
  const { bdo, ...rest } = options;

  return useTable<T>({
    queryKey: ['table', bdo.meta._id],
    listFn: (opts) => bdo.list(opts),
    countFn: (opts) => bdo.count(opts),
    ...rest,
  });
}
