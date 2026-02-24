import { useTable } from '../useTable';
import type {
  BDOTableSourceType,
  BDORowType,
  UseBDOTableOptionsType,
  UseBDOTableReturnType,
} from './types';

export function useBDOTable<B extends BDOTableSourceType>(
  options: UseBDOTableOptionsType<B>,
): UseBDOTableReturnType<B> {
  const { bdo, ...rest } = options;

  return useTable<BDORowType<B>>({
    queryKey: ['table', bdo.meta._id],
    listFn: async (opts) => ({ Data: await bdo.list(opts) }),
    countFn: async (opts) => ({ Count: await bdo.count(opts) }),
    ...rest,
  });
}
