# Documentation Gaps — Critical Issues

Audit of all 8 docs against the source code. Only **critical** issues listed (wrong code, broken imports, missing major features).

---

## docs/api.md

### 1. Most API client methods are undocumented

The doc only covers `get`, `list`, `create`, `update`, `delete`. These 13 methods are completely missing:

| Method | Return Type |
|--------|------------|
| `count(options?)` | `CountResponseType` |
| `draft(data)` | `DraftResponseType` |
| `draftUpdate(id, data)` | `CreateUpdateResponseType` |
| `draftPatch(id, data)` | `DraftResponseType` |
| `draftInteraction(data)` | `DraftResponseType & { _id: string }` |
| `metric(options)` | `MetricResponseType` |
| `pivot(options)` | `PivotResponseType` |
| `fields()` | `FieldsResponseType` |
| `fetchField(instanceId, fieldId)` | `TResult[]` |
| `getUploadUrl(instanceId, fieldId, files)` | `FileUploadResponseType[]` |
| `getDownloadUrl(instanceId, fieldId, attachmentId, viewType?)` | `FileDownloadResponseType` |
| `getDownloadUrls(instanceId, fieldId, viewType?)` | `FileDownloadResponseType[]` |
| `deleteAttachment(instanceId, fieldId, attachmentId)` | `void` |

**Source**: `sdk/api/client.ts` lines 28-167 (`ResourceClientType` interface)

### 2. API configuration functions are undocumented

The most fundamental setup step — telling the SDK where the API lives — is not documented:

```typescript
// These are exported from @ram_28/kf-ai-sdk/api but not in the doc
setApiBaseUrl(url: string): void
getApiBaseUrl(): string
setDefaultHeaders(headers: Record<string, string>): void
getDefaultHeaders(): Record<string, string>
```

**Source**: `sdk/api/client.ts` lines 190-213, `sdk/api.ts` lines 9-13

---

## docs/bdo.md

### 3. `ArrayField` and `ObjectField` missing from field classes table

Two entire field classes are undocumented:

- `ArrayField<T>` — has `elementType` getter (returns `BaseFieldMetaType | undefined`)
- `ObjectField<T>` — has `properties` getter (returns `Record<string, unknown> | undefined`)

**Source**: `sdk/bdo/fields/ArrayField.ts`, `sdk/bdo/fields/ObjectField.ts`

### 4. `draftUpdate` method undocumented

Protected CRUD method on `BaseBdo` that commits changes on an existing draft record:

```typescript
protected async draftUpdate(id: string, data: Partial<TEditable>): Promise<CreateUpdateResponseType>
```

**Source**: `sdk/bdo/core/BaseBdo.ts` lines 275-280

### 5. File/Image attachment methods on Item accessors are undocumented

When an Item field is Image or File type, the accessor gets enriched with attachment methods. None are documented:

**Image field accessor (editable)**:
- `upload(file: File): Promise<FileType>`
- `getDownloadUrl(viewType?): Promise<FileDownloadResponseType>`
- `deleteAttachment(): Promise<void>`

**Image field accessor (readonly)**:
- `getDownloadUrl(viewType?): Promise<FileDownloadResponseType>`

**File field accessor (editable)**:
- `upload(files: File[]): Promise<FileType[]>`
- `getDownloadUrl(attachmentId, viewType?): Promise<FileDownloadResponseType>`
- `getDownloadUrls(viewType?): Promise<FileDownloadResponseType[]>`
- `deleteAttachment(attachmentId): Promise<void>`

**File field accessor (readonly)**:
- `getDownloadUrl(attachmentId, viewType?): Promise<FileDownloadResponseType>`
- `getDownloadUrls(viewType?): Promise<FileDownloadResponseType[]>`

**Source**: `sdk/bdo/core/types.ts` lines 194-235, `sdk/bdo/core/Item.ts` lines 293-463

---

## docs/useBDOForm.md

### 6. `UseBDOFormOptionsType` missing 3 feature flags

All three variants of the options type are missing these properties:

```typescript
enableDraft?: boolean;                  // default: false (currently unused internally)
enableConstraintValidation?: boolean;   // default: true (required, length, etc.)
enableExpressionValidation?: boolean;   // default: true (backend expression rules)
```

**Source**: `sdk/components/hooks/useBDOForm/types.ts` lines 90-123

### 7. `UseBDOFormReturnType` missing ~half its properties

These properties are returned by the hook but not in the doc:

| Property | Type |
|----------|------|
| `bdo` | `B` (the BDO reference) |
| `operation` | `"create" \| "update"` |
| `recordId` | `string \| undefined` |
| `reset` | `UseFormReset` |
| `trigger` | `UseFormTrigger` |
| `isValid` | `boolean` |
| `isSubmitSuccessful` | `boolean` |
| `dirtyFields` | `Partial<Record<keyof AllFieldsType<B>, boolean>>` |
| `isFetching` | `boolean` (separate from isLoading) |
| `draftId` | `string \| undefined` |
| `isCreatingDraft` | `boolean` |

**Source**: `sdk/components/hooks/useBDOForm/types.ts` lines 190-232, `sdk/components/hooks/useBDOForm/useBDOForm.ts` lines 320-352

### 8. `handleSubmit` behavior is wrong — doc says `bdo.create()`/`bdo.update()`, actual uses `api()` directly

The doc says handleSubmit "auto-calls `bdo.create()` or `bdo.update()`". The actual implementation:

```typescript
// Create mode — uses api().draft(), NOT bdo.create()
filteredData._id = draftData?._id;
result = await api(bdo.meta._id).draft(filteredData);

// Update mode — uses api().update() directly, NOT bdo.update()
result = await api(bdo.meta._id).update(recordId!, filteredData);
```

**Source**: `sdk/components/hooks/useBDOForm/useBDOForm.ts` lines 296-301

### 9. Draft mode is completely undocumented

The entire draft-based creation flow is absent from the doc:

1. On form open (create mode), a draft is auto-created via `api().draftInteraction({})`
2. The draft `_id` is set into the form via `form.setValue("_id", draftData._id)`
3. Dirty fields are auto-patched to the draft on change (800ms debounce)
4. On submit, `api().draft(filteredData)` is called with the draft `_id`
5. `isLoading` reflects `isCreatingDraft` state
6. `draftId` and `isCreatingDraft` are returned

**Source**: `sdk/components/hooks/useBDOForm/useBDOForm.ts` lines 125-138, 186-190, 222-261, 296-298

---

## docs/useBDOTable.md

### 10. `RHSType` import path is broken — will fail at build time

The doc shows:
```typescript
import { ConditionOperator, RHSType } from "@ram_28/kf-ai-sdk/filter";
```

`RHSType` is **not** exported from the filter module under that name. It is renamed to `FilterValueSource` on export:

```typescript
// sdk/filter.ts
export { RHSType as FilterValueSource } from './types/constants';
```

`RHSType` IS exported (under its original name) from `@ram_28/kf-ai-sdk/table`:
```typescript
// sdk/table.ts
export { ConditionOperator, RHSType } from './types/constants';
```

The complete example at line 121 has the same broken import, so the entire example won't compile.

**Source**: `sdk/filter.ts` line 19, `sdk/table.ts` line 17

---

## docs/useActivityTable.md

*No remaining critical gaps — #11 (GET endpoints ignoring options) was resolved when list/metric endpoints were switched to POST.*

---

## docs/useFilter.md

### 13. `updateGroupOperator` method missing from `UseFilterReturnType`

Fully implemented and exported, but absent from the documented return type:

```typescript
updateGroupOperator: (id: string, operator: ConditionGroupOperatorType) => void;
```

Allows updating the operator ("And"/"Or"/"Not") of a nested condition group by ID.

**Source**: `sdk/components/hooks/useFilter/types.ts` lines 122-127, `sdk/components/hooks/useFilter/useFilter.ts` lines 241-253

### 14. `getCondition` method missing from `UseFilterReturnType`

Fully implemented and exported, but absent from the documented return type:

```typescript
getCondition: (id: string) => ConditionType<T> | ConditionGroupType<T> | undefined;
```

Looks up a condition or condition group by ID — essential for dynamic filter UIs.

**Source**: `sdk/components/hooks/useFilter/types.ts` lines 139-144, `sdk/components/hooks/useFilter/useFilter.ts` lines 263-268

---

## docs/useAuth.md

### 15. `login()` parameter types are wrong

Doc shows:
```typescript
login: (provider?: string, options?: { callbackUrl?: string }) => void;
```

Actual:
```typescript
login: (provider?: AuthProviderNameType, options?: LoginOptionsType) => void;
// AuthProviderNameType = "google" | "microsoft" | "github" | "custom"
// LoginOptionsType = { callbackUrl?: string; params?: Record<string, string> }
```

The `provider` is constrained to a union (not open `string`), and `options` has a `params` property the doc omits.

**Source**: `sdk/auth/types.ts` line 170, lines 32, 118-123

### 16. `refreshSession` return type is `Promise<any>` — should be `Promise<SessionResponseType | null>`

Doc shows:
```typescript
refreshSession: () => Promise<any>;
```

Actual:
```typescript
refreshSession: () => Promise<SessionResponseType | null>;
// SessionResponseType = { userDetails: UserDetailsType; staticBaseUrl: string; buildId: string }
```

**Source**: `sdk/auth/types.ts` line 181, `sdk/auth/AuthProvider.tsx` lines 167-168

### 17. `AuthProvider` props completely undocumented

`AuthProviderPropsType` has 7 props — none are documented or shown in any example:

```typescript
interface AuthProviderPropsType {
  children: React.ReactNode;
  config?: Partial<AuthConfigType>;
  onAuthChange?: (status: AuthStatusType, user: UserDetailsType | null) => void;
  onError?: (error: Error) => void;
  loadingComponent?: React.ReactNode;
  unauthenticatedComponent?: React.ReactNode;
  skipInitialCheck?: boolean;
}
```

**Source**: `sdk/auth/types.ts` lines 93-113

### 18. `AuthConfigType` and `configureAuth()` completely undocumented

The entire auth configuration system is exported but absent from docs:

```typescript
// Exported from @ram_28/kf-ai-sdk/auth
configureAuth(config: Partial<AuthConfigType>): void
getAuthConfig(): AuthConfigType
setAuthProvider(provider: AuthProviderNameType): void
getAuthBaseUrl(): string
resetAuthConfig(): void
```

`AuthConfigType` has 12 properties (session endpoint, providers map, default provider, auto-redirect, login redirect URL, callback URL, session check interval, retry config, stale time, refetch on focus, refetch on reconnect, base URL).

**Source**: `sdk/auth/authConfig.ts`, `sdk/auth.ts` lines 16-22

### 19. `QueryClientProvider` requirement not documented

`AuthProvider` calls `useQueryClient()` from `@tanstack/react-query`. A `QueryClientProvider` must wrap `AuthProvider`, or users get a runtime error on mount. No setup/bootstrap example exists.

**Source**: `sdk/auth/AuthProvider.tsx` lines 15-16, 64

---

## docs/workflow.md

### 20. `BPInstanceId` missing from `ActivityInstanceFieldsType`

Doc shows 4 fields. Source has 5:

```typescript
type ActivityInstanceFieldsType = {
  _id: StringFieldType;
  BPInstanceId: StringFieldType;   // <-- MISSING from doc
  Status: SelectFieldType<"InProgress" | "Completed">;
  AssignedTo: UserFieldType[];
  CompletedAt: DateTimeFieldType;
};
```

Also missing from the "ActivityInstance System Fields Reference" table at the bottom of the doc.

**Source**: `sdk/workflow/types.ts` lines 49-55

### ~~21. List/metric endpoints use GET, not POST — options are ignored~~

**RESOLVED**: All four list/metric endpoints now use POST with proper request bodies. Count methods construct `{ Type: "Metric", Metric: [{Field: "_id", Type: "Count"}] }` and transform the response correctly.

### 23. `activity.Field.meta.label` and `activity.Field.meta.id` don't exist

All form examples use `activity.StartDate.meta.label` and `activity.StartDate.meta.id`. These return `undefined` because `BaseFieldMetaType` has `_id` and `Name`, not `id` and `label`:

```typescript
// BaseFieldMetaType has:
_id: string;   // NOT "id"
Name: string;  // NOT "label"

// The convenience getters are on BaseField itself:
activity.StartDate.id      // works (BaseField getter)
activity.StartDate.label   // works (BaseField getter)
activity.StartDate.meta._id   // works (raw meta)
activity.StartDate.meta.Name  // works (raw meta)

// But the doc uses:
activity.StartDate.meta.id    // undefined
activity.StartDate.meta.label // undefined
```

This affects **every** `register()` call and `<label>` in the doc's examples — they all pass `undefined`.

**Source**: `sdk/bdo/fields/BaseField.ts` lines 24-27, `sdk/bdo/core/types.ts` lines 35-43

---

## Summary

| Doc | Critical Count |
|-----|---------------|
| api.md | 2 |
| bdo.md | 3 |
| useBDOForm.md | 4 |
| useBDOTable.md | 1 |
| useActivityTable.md | 0 (resolved) |
| useFilter.md | 2 |
| useAuth.md | 5 |
| workflow.md | 2 |
| **Total** | **19** |
