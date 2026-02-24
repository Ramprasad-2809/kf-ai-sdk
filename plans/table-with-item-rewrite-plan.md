# Plan: Table Hooks Return Item/ActivityInstance Rows

## Context

Table hooks (`useBDOTable`, `useActivityTable`) currently return `rows` as plain objects from the API response. Consumers access fields as `row.Title` (raw value). This is inconsistent with the rest of the SDK where data access goes through Item/ActivityInstance wrappers with `.get()`, `.set()`, `.validate()`, `.meta`, `.toJSON()`.

**BDO's `list()` already wraps in Item** (`BaseBdo.ts:187-192`). Activity's `getInProgressList()`/`getCompletedList()` do NOT wrap — they return plain objects. The fix: make Activity list methods wrap like BDO, then have both hooks call through to their respective class methods.

**Principle: Classes own the wrapping, hooks just call through.** No `Item` or `createActivityInstance` imports in hooks. No new internal accessor methods (`_list`, `_count`, etc.) — use the methods that already exist. Matches how `useBDOForm` calls `bdo.get()` and `useActivityForm` calls `activity.getInstance()`.

---

## Part 1: Wrap Activity list methods in ActivityInstance

**File**: `sdk/workflow/Activity.ts`

Currently `getInProgressList()`/`getCompletedList()` pass through plain objects from the client. Change them to wrap each row in `createActivityInstance()` (matching how `getInstance()` already wraps single reads).

**Return type changes from** `ListResponseType<ActivityInstanceFieldsType & TEntity>` **to** `ActivityInstanceType<...>[]` (unwrapped array, matching BDO's `list()` pattern).

Add a type alias for readability:

```typescript
/** Activity system fields as readonly (excluding _id which is handled separately) */
type ActivitySystemReadonlyType = Omit<ActivityInstanceFieldsType, '_id'>;
```

Updated methods:

```typescript
async getInProgressList(
  options?: ListOptionsType,
): Promise<ActivityInstanceType<
  ActivityInstanceFieldsType & TEntity,
  TEditable,
  TReadonly & ActivitySystemReadonlyType
>[]> {
  const response = await this._ops().inProgressList(options);
  const fields = this._discoverFields();
  const ops = this._ops();
  return response.Data.map((data) =>
    createActivityInstance<
      ActivityInstanceFieldsType & TEntity,
      TEditable,
      TReadonly & ActivitySystemReadonlyType
    >(ops, (data as any)._id, data as (ActivityInstanceFieldsType & TEntity), fields)
  );
}
```

Same pattern for `getCompletedList()`.

**Why `TReadonly & ActivitySystemReadonlyType`?** Puts activity system fields (`Status`, `AssignedTo`, `CompletedAt`, `BPInstanceId`) into the readonly accessor position — `row.Status.get()` returns typed value. `_id` is excluded because `ActivityInstanceType` already has `{ readonly _id: string }`.

Add needed import: `ActivityInstanceType` from `./ActivityInstance` (already imports `createActivityInstance`).

**No other changes to Activity.ts** — `inProgressCount()`, `completedCount()`, `inProgressMetric()`, `completedMetric()`, `getInstance()` all stay as-is.

---

## Part 2: Update `useBDOTable` types and implementation

### 2.1 Types — `sdk/components/hooks/useBDOTable/types.ts`

Change generic from `<T>` (plain entity) to `<B>` (BDO class) with a **structural type constraint**. Row type is inferred from `list()` return type — no need to import `BaseBdo` or `ItemType`.

```typescript
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
```

**Why structural typing?** `list()` and `count()` are `protected` on `BaseBdo`, but generated subclasses expose them as `public`. A structural constraint accepts any object with those public methods — no need to import `BaseBdo` (which would create a circular concern) or know about the class hierarchy.

### 2.2 Implementation — `sdk/components/hooks/useBDOTable/useBDOTable.ts`

Remove `api` import. Call through to BDO's existing `list()` and `count()` methods, wrapping to match `useTable`'s `listFn`/`countFn` signatures.

```typescript
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
```

**Key:** `bdo.list()` returns `ItemType[]` and `bdo.count()` returns `number`. The hook wraps these into `{ Data: ... }` and `{ Count: ... }` to match `useTable`'s `ListResponseType<T>` and `CountResponseType` signatures.

---

## Part 3: Update `useActivityTable` types and implementation

### 3.1 Types — `sdk/components/hooks/useActivityTable/types.ts`

Change `ActivityRowType` from plain object intersection to wrapped `ActivityInstanceType`, inferred structurally from `getInProgressList()` return type.

```typescript
import type { Activity } from '../../../workflow/Activity';
import type { UseTableReturnType, PaginationStateType } from '../useTable/types';
import type { UseFilterOptionsType } from '../useFilter/types';
import type { SortType } from '../../../types/common';

export const ActivityTableStatus = {
  InProgress: 'inprogress',
  Completed: 'completed',
} as const;

export type ActivityTableStatusType =
  (typeof ActivityTableStatus)[keyof typeof ActivityTableStatus];

/** Row type — inferred from Activity's getInProgressList() return type */
export type ActivityRowType<A extends Activity<any, any, any>> =
  A extends { getInProgressList(opts?: any): Promise<(infer R)[]> }
    ? R
    : never;

export interface UseActivityTableOptionsType<A extends Activity<any, any, any>> {
  activity: A;
  status: ActivityTableStatusType;
  initialState?: {
    sort?: SortType;
    pagination?: PaginationStateType;
    filter?: UseFilterOptionsType<ActivityRowType<A>>;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: ActivityRowType<A>[]) => void;
}

export type UseActivityTableReturnType<A extends Activity<any, any, any>> =
  UseTableReturnType<ActivityRowType<A>>;
```

### 3.2 Implementation — `sdk/components/hooks/useActivityTable/useActivityTable.ts`

Remove `_getOps()` usage. Call through to Activity's existing public methods.

```typescript
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
        ? async (opts: any) => ({ Data: await activity.getInProgressList(opts) })
        : async (opts: any) => ({ Data: await activity.getCompletedList(opts) }),
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
```

---

## Part 4: No changes to `useTable` or `BaseBdo`

- **`useTable<T>`** stays as-is. When `T = ItemType<...>` or `T = ActivityInstanceType<...>`, `rows: T[]` delivers wrapped instances. `keyof T` for search/sort/filter includes field names + `_id` + `validate` + `toJSON` (minor extra keys, harmless).
- **`BaseBdo.ts`** stays as-is. `list()` and `count()` already exist as `protected`, generated subclasses expose them as `public`.

---

## Part 5: Update barrel exports

### `sdk/table.types.ts`

Add exports for new types:

```typescript
export type { BDOTableSourceType, BDORowType } from './components/hooks/useBDOTable/types';
```

### `sdk/workflow.types.ts`

No changes needed — `ActivityRowType` is already exported (definition changes automatically).

---

## Part 6: Update docs

### 6.1 `docs/useBDOTable.md`

- **Generic change**: `useBDOTable<EntityType>({...})` → `useBDOTable({...})` (inferred from BDO)
- **Row access**: `row.Title` → `row.Title.get()`, `row._id` stays direct
- **Type definitions**: Update `UseBDOTableOptionsType<B>`, add `BDOTableSourceType`, `BDORowType<B>`
- **Common Mistakes**: Add `.get()` accessor pattern

### 6.2 `docs/useActivityTable.md`

- **Row access**: `row.Field` → `row.Field.get()` for all fields
- **Reverse** the "Calling `.get()` on activity table rows" common mistake — `.get()` is now correct
- **Type definitions**: Update `ActivityRowType<A>` to show it resolves to `ActivityInstanceType`

### 6.3 `docs/workflow.md`

- **`getInProgressList()`/`getCompletedList()`**: Return type changes from `ListResponseType<...>` to `ActivityInstanceType<...>[]`
- **Examples**: Update to show `.get()` accessor pattern on returned items

---

## Files Modified

| # | File | Changes |
|---|------|---------|
| 1 | `sdk/workflow/Activity.ts` | Wrap `getInProgressList()`/`getCompletedList()` in `createActivityInstance`, add type alias, add `ActivityInstanceType` import |
| 2 | `sdk/components/hooks/useBDOTable/types.ts` | Generic `<T>` → `<B extends BDOTableSourceType>`, add `BDOTableSourceType`, `BDORowType<B>` |
| 3 | `sdk/components/hooks/useBDOTable/useBDOTable.ts` | Remove `api` import, call `bdo.list()` / `bdo.count()` with wrapping |
| 4 | `sdk/components/hooks/useActivityTable/types.ts` | `ActivityRowType` inferred from `getInProgressList()` return type |
| 5 | `sdk/components/hooks/useActivityTable/useActivityTable.ts` | Remove `_getOps()`, call `activity.getInProgressList()` / `activity.getCompletedList()` / count methods |
| 6 | `sdk/table.types.ts` | Export `BDOTableSourceType`, `BDORowType` |
| 7 | `docs/useBDOTable.md` | Update generic, row access examples, type definitions |
| 8 | `docs/useActivityTable.md` | Update row access examples, reverse `.get()` mistake, type definitions |
| 9 | `docs/workflow.md` | Update `getInProgressList`/`getCompletedList` return types and examples |

---

## Verification

1. `pnpm run typecheck` — no type errors
2. `pnpm run build` — build succeeds
3. Grep: `rg "api\(" sdk/components/hooks/useBDOTable/` → no hits (api import removed)
4. Grep: `rg "_getOps" sdk/components/hooks/useActivityTable/` → no hits
5. Manual test: table page → `rows[0].Title.get()` returns value, `rows[0]._id` returns string, `rows[0].toJSON()` returns plain object

---

## Breaking Changes (ecommerce-app)

All table consumers must update row field access from `row.Field` to `row.Field.get()`:

| File | Fields to update |
|------|-----------------|
| `BuyerProductListPage.tsx` | Title, Description, Category, Brand, Price, MRP, Stock, ImageUrl |
| `SellerProductsPage.tsx` | Title, Description, Category, Price, Stock |
| `SupplierPage.tsx` | SupplierName, Email, ContactPerson, Phone, City, Country, PaymentTerms, Rating, IsActive |
| `InventoryRestockingPage.tsx` | Stock, ReorderLevel, Warehouse, Title, Category, SKU |
| `FieldTestPage.tsx` | Name, Code, Status, Amount, StartDate |
| `WorkflowTestPage.tsx` | _id (stays direct), Status, BPInstanceId, AssignedTo, dynamic `row[col]` |

`useBDOTable` generic changes: `useBDOTable<EntityType>({...})` → `useBDOTable({...})` (generic inferred from BDO).

**Note**: `BuyerCartPage.tsx` calls `cartItem.list()` directly — unaffected (BaseBdo.list() is unchanged).
