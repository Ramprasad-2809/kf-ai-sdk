# SDK Deep Knowledge

Comprehensive internals reference for `@ram_28/kf-ai-sdk`. Read this when working on merge conflicts, refactoring, or adding features.

---

## 1. FILE DEPENDENCY MAP

### Export Chain (source → entry → package.json)
```
sdk/bdo/fields/*.ts → sdk/bdo/fields/index.ts → sdk/bdo/index.ts → sdk/bdo.ts → dist/bdo.mjs
sdk/bdo/core/*.ts   → sdk/bdo/core/index.ts   → sdk/bdo/index.ts → sdk/bdo.ts
sdk/bdo/expressions/*.ts → sdk/bdo/expressions/index.ts → sdk/bdo/index.ts
sdk/api/*.ts        → sdk/api/index.ts        → sdk/api.ts       → dist/api.mjs
sdk/auth/*.ts       → sdk/auth/index.ts        → sdk/auth.ts      → dist/auth.mjs
sdk/workflow/*.ts   → sdk/workflow/index.ts     → sdk/workflow.ts   → dist/workflow.mjs
sdk/types/*.ts      → sdk/types/index.ts        → sdk/base-types.ts → dist/types.mjs
sdk/utils/*.ts      → sdk/utils/index.ts        → sdk/utils.ts      → dist/utils.mjs
sdk/components/hooks/useBDOForm/*   → sdk/form.ts   → dist/form.mjs
sdk/components/hooks/useTable/*    → sdk/table.ts  → dist/table.mjs
sdk/components/hooks/useFilter/*   → sdk/filter.ts → dist/filter.mjs
sdk/components/hooks/useBDOTable/* → sdk/table.ts  (bundled with useTable)
sdk/components/hooks/useActivityForm/*  → sdk/workflow.ts (bundled with workflow)
sdk/components/hooks/useActivityTable/* → sdk/workflow.ts (bundled with workflow)
```

### Cross-Module Dependencies
- `BaseBdo` depends on: `api/client`, `bdo/core/Item`, `bdo/fields/*`, `bdo/expressions/ExpressionEngine`
- `Item` depends on: `bdo/fields/BaseField`, `bdo/core/types`, `api/client` (for attachments)
- `useBDOForm` depends on: `BaseBdo`, `api/metadata` (getBdoSchema), `bdo/expressions/ExpressionEngine`
- `useTable` depends on: `useFilter`, `types/common` (ListOptionsType), `utils/api/buildListOptions`
- `useBDOTable` depends on: `useTable` (thin wrapper)
- `useActivityForm` depends on: `Activity`, `api/metadata` (getBdoSchema), `workflow/createFieldFromMeta`
- `useActivityTable` depends on: `useTable`, `Activity._getOps()`
- `Activity` depends on: `workflow/client` (Workflow), `workflow/ActivityInstance`, `bdo/fields/BaseField`
- `ActivityInstance` depends on: `workflow/types` (ActivityOperations), `bdo/fields/BaseField`
- `AuthProvider` depends on: `auth/authClient`, `auth/authConfig`, `@tanstack/react-query`

---

## 2. PROXY IMPLEMENTATIONS (Critical for Merge Conflicts)

### Item Proxy (`sdk/bdo/core/Item.ts`)
The `Item` constructor returns a `new Proxy(this, handler)`. Traps:

**get(target, prop):**
1. Own methods/properties (validate, toJSON, _bdo, _data, _accessorCache, _getAccessor, _requireInstanceId) → `Reflect.get()`
2. Symbols → `Reflect.get()`
3. `_id` → returns `_data._id` directly (NOT as accessor)
4. Everything else → `_getAccessor(prop)` which returns cached field accessor

**set(target, prop, value):**
1. Own properties → return false (prevent)
2. Symbols → `Reflect.set()`
3. Everything else → `_data[prop] = value` (shorthand for field.set())

**_getAccessor(fieldId) creates:**
- Editable: `{ label, required, readOnly, defaultValue, meta, get(), set(), getOrDefault(), validate() }`
- Readonly: same but NO `set()`
- Image fields add: `getDownloadUrl()`, `upload()` (editable), `deleteAttachment()` (editable)
- File fields add: `getDownloadUrl()`, `getDownloadUrls()`, `upload()` (editable), `deleteAttachment()` (editable)

**validate() on accessor:**
1. Type validation via `fieldDef.validate(value)`
2. Expression validation via `bdo.validateFieldExpression()` (if metadata loaded)

### ActivityInstance Proxy (`sdk/workflow/ActivityInstance.ts`)
Similar to Item but for workflow activities. `createActivityInstance()` returns Proxy.

**get(target, prop):**
1. Instance methods (validate, toJSON, update, save, complete, progress, _ops, _data, _fields, _accessorCache, _getAccessor) → `Reflect.get()`
2. Symbols → `Reflect.get()`
3. `_id` → `target._id` directly
4. Everything else → `target._getAccessor(prop)`

**Persistence methods:**
- `update(data)` → `ops.update(instanceId, data)`
- `save(data)` → `ops.draftEnd(instanceId, data)` (commits draft)
- `complete()` → `ops.complete(instanceId)`
- `progress()` → `ops.progress(instanceId)`

### Form Item Proxy (`sdk/components/hooks/useBDOForm/createItemProxy.ts`)
Wraps RHF state, NOT backend data. Different from Item proxy.

**get():**
- `_id` → `form.getValues("_id")`
- `toJSON` → `() => form.getValues()`
- `validate` → `() => form.trigger()`
- Fields → accessor synced with RHF state (get = form value, set = `form.setValue(prop, value, { shouldDirty: true, shouldTouch: true })`)

### Activity Form Item Proxy (`sdk/components/hooks/useActivityForm/createActivityItemProxy.ts`)
Nearly identical to Form Item Proxy but uses activity fields instead of BDO fields.

---

## 3. HOOK INTERNALS

### useBDOForm — State & Queries
```
State:
- React Hook Form instance (mode, resolver, defaultValues)
- Record query: queryKey ["form-record", boId, recordId], enabled when update mode
- Draft query: queryKey ["form-draft", boId], enabled when create mode, staleTime: Infinity, gcTime: 0
- Schema query: queryKey ["form-schema", boId], 30min cache, loads into bdo.loadMetadata()

Resolver (createResolver.ts):
- Phase 1: field.validate(value) — type check
- Phase 2: validateConstraints(field, value) — required, length, number precision
- Phase 3: bdo.validateFieldExpression(fieldId, value, allValues) — backend rules

handleSubmit:
- Create mode: filters to non-readonly fields, sets _id from draft, calls bdo.draft(data)
- Update mode: filters to dirty + non-readonly fields, calls bdo.update(recordId, data)
- Coerces values via coerceFieldValue() before API call

register():
- Wraps RHF register, adds { disabled: true } for readonly fields
```

### useTable — State & Queries
```
State:
- search: { query, debouncedQuery, field } — 300ms debounce via useRef timeout
- sort: { field, direction } — toggle cycles ASC→DESC→null
- pagination: { pageNo, pageSize } — resets to 1 on filter/search change
- filter: useFilter() instance

Two parallel queries:
- List: queryKey [...queryKey, apiOptions], staleTime: 0, gcTime: 30s
- Count: queryKey [...queryKey, 'count', countApiOptions], staleTime: 0, gcTime: 30s

Search + Filter combination:
- Search becomes a Contains condition merged into filter
- If base filter is 'And', search appended. Otherwise wrapped in new 'And' group.
```

### useFilter — Tree Operations
```
Internal state:
- items: Array<ConditionType | ConditionGroupType> (each has auto-generated id)
- operator: "And" | "Or" | "Not" (root level)

payload (useMemo): strips ids from items for API consumption
Tree helpers: findById, updateInTree, removeFromTree, addToParent (all recursive)
ID generation: filter_{timestamp}_{random}_{counter}
```

### useActivityForm — Activity-Specific Logic
```
Unique features vs useBDOForm:
- Fetches BP metadata (getBdoSchema) to discover field definitions dynamically
- Finds activityDef in BDOBlob.Activity[] by activityId
- Builds fields from activityDef.Input via buildFieldsFromInput()
- Discovers extra readonly fields from read() response (Context-derived)
- Mode-aware field syncing: onChange/onBlur calls ops.update() per-field
- Enhanced register injects onBlur/onChange handlers for field sync
- Enhanced control (Proxy) intercepts control.register() for same sync
- handleComplete = handleSubmit + ops.complete()
```

### useActivityTable — Thin Wrapper
```
Selects API functions based on status:
- "inprogress" → ops.inProgressList() + ops.inProgressMetric()
- "completed" → ops.completedList() + ops.completedMetric()
queryKey: ['activity-table', bpId, activityId, status]
```

### useBDOTable — Thin Wrapper
```
queryKey: ['table', bdo.meta._id]
listFn: bdo.list(), countFn: bdo.count()
```

---

## 4. API CLIENT INTERNALS (`sdk/api/client.ts`)

### Factory Pattern
```typescript
api<T>(bo_id) → createResourceClient<T>(`/api/app/${bo_id}`)
```

### Request Details
- All methods use native `fetch()` with `getDefaultHeaders()`
- URL: `${getApiBaseUrl()}${basePath}/${operation}`
- Error: `throw new Error("Failed to {op} {path}: {statusText}")` — plain Error, no custom types
- Responses auto-unwrap `{ Data: ... }` envelope

### Method-Endpoint Mapping
| Method | HTTP | Path | Body | Returns |
|--------|------|------|------|---------|
| get(id) | GET | /{id}/read | — | T (unwrapped from Data) |
| create(data) | POST | /create | JSON | CreateUpdateResponseType |
| update(id, data) | POST | /{id}/update | JSON | CreateUpdateResponseType |
| delete(id) | DELETE | /{id}/delete | — | DeleteResponseType |
| list(opts) | POST | /list | JSON (Type:"List" + opts) | ListResponseType<T> |
| count(opts) | POST | /metric | JSON (Metric:[{Field:"_id",Type:"Count"}]) | CountResponseType |
| draft(data) | POST | /draft | JSON | DraftResponseType |
| draftUpdate(id, data) | POST | /{id}/draft | JSON | CreateUpdateResponseType |
| draftPatch(id, data) | PATCH | /{id}/draft | JSON | DraftResponseType |
| draftInteraction(data) | PATCH | /draft | JSON | DraftResponseType & {_id} |
| metric(opts) | POST | /metric | JSON (Type:"Metric" + opts) | MetricResponseType |
| pivot(opts) | POST | /pivot | JSON (Type:"Pivot" + opts) | PivotResponseType |
| fields() | GET | /fields | — | FieldsResponseType |
| fetchField(instId, fId) | GET | /{instId}/field/{fId}/fetch | — | TResult[] |

### Attachment Endpoints
| Method | HTTP | Path |
|--------|------|------|
| getUploadUrl | POST | /{instId}/field/{fId}/attachment/upload |
| getDownloadUrl | GET | /{instId}/field/{fId}/attachment/{attId}/read |
| getDownloadUrls | GET | /{instId}/field/{fId}/attachment/read |
| deleteAttachment | DELETE | /{instId}/field/{fId}/attachment/{attId}/delete |

### DateTime Encoding
- API sends dates as: `{ "$__d__": "YYYY-MM-DD" }` and `{ "$__dt__": unix_seconds }`
- SDK sends to API as strings: `formatDate()` → "YYYY-MM-DD", `formatDateTime()` → "YYYY-MM-DD HH:MM:SS"

---

## 5. WORKFLOW CLIENT (`sdk/workflow/client.ts`)

### Workflow Class
```typescript
new Workflow<T>(bp_id)
  .start()                    → POST /api/app/process/{bp_id}/start
  .progress(instance_id)      → GET  /api/app/process/{bp_id}/{instance_id}/progress
  .activity(activity_id)      → returns ActivityOperations<T>
```

### ActivityOperations Endpoints
| Method | HTTP | Path |
|--------|------|------|
| inProgressList(opts?) | GET | /process/{bp}/{act}/inprogress/list |
| completedList(opts?) | GET | /process/{bp}/{act}/completed/list |
| inProgressMetric(opts?) | GET | /process/{bp}/{act}/inprogress/metric |
| completedMetric(opts?) | GET | /process/{bp}/{act}/completed/metric |
| read(instId) | GET | /process/{bp}/{act}/{instId}/read |
| update(instId, data) | POST | /process/{bp}/{act}/{instId}/update |
| draftStart(instId, data) | PATCH | /process/{bp}/{act}/{instId}/draft |
| draftEnd(instId, data) | POST | /process/{bp}/{act}/{instId}/draft |
| complete(instId) | POST | /process/{bp}/{act}/{instId}/done |
| progress(instId) | GET | /process/{bp}/{act}/{instId}/progress |

---

## 6. AUTH INTERNALS (`sdk/auth/`)

### AuthProvider State Flow
```
Mount → configureAuth() (once via useRef) → useQuery(fetchSession)
  → Derives: status, user, isAuthenticated
  → Effects: onAuthChange callback, error callback, auto-redirect

Session Query:
- Key: ["auth", "session"]
- Endpoint: GET {baseUrl}/api/id (default)
- Retry: 401/403 → stop, others → retry 3x with 1s delay
- staleTime: 5min, gcTime: 10min

Login: window.open(loginUrl, '_blank') — opens new tab, returns Promise<never>
Logout: POST {logoutPath}, then redirect (if configured)
```

### Default Auth Config
```typescript
{
  sessionEndpoint: "/api/id",
  providers: { google: { loginPath: "/api/auth/google/login", logoutPath: "/api/auth/logout" } },
  defaultProvider: "google",
  autoRedirect: false,
  sessionCheckInterval: 0,
  retry: { count: 3, delay: 1000 },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
}
```

---

## 7. EXPRESSION ENGINE (`sdk/bdo/expressions/ExpressionEngine.ts`)

### Validation Flow
```
loadMetadata(metadata) → extracts ValidationRule[] per field from Fields + Rules.Validation
validateField(fieldId, value, allValues) → evaluates each rule's ExpressionTree
  → evaluateNode(node, context) — recursive evaluator
```

### Node Types
- Literal, Identifier (form field), SystemIdentifier (NOW, TODAY, CURRENT_USER)
- BinaryExpression: ==, !=, <, <=, >, >=, +, -, *, /, %
- LogicalExpression: AND, OR, !
- CallExpression: 23 built-in functions
- MemberExpression: property access

### Built-in Functions (23)
String: CONCAT, UPPER, LOWER, TRIM, LENGTH, SUBSTRING, REPLACE
Math: SUM, AVG, MIN, MAX, ABS, ROUND, FLOOR, CEIL
Date: YEAR, MONTH, DAY, DATE_DIFF, ADD_DAYS, ADD_MONTHS
Conditional: IF
System: UUID

---

## 8. BUILD CONFIGURATION

### Vite Entry Points (config/vite.config.js)
16 entries (14 runtime + 2 type-only): form, form.types, table, table.types, filter, filter.types, auth, auth.types, api, api.types, workflow, workflow.types, utils, types (→base-types.ts), bdo, bdo.types

### package.json Exports (16 paths)
Each has: `import` (.mjs + types .d.ts), `require` (.cjs)
Special: `./docs/*` → raw pass-through to docs/

### External Dependencies (not bundled)
react, react-dom, react/jsx-runtime, @tanstack/react-query

### Runtime Dependencies (bundled)
react-hook-form, clsx, tailwind-merge, @tanstack/react-virtual

---

## 9. TYPE SYSTEM DETAILS

### Field Meta Hierarchy
```
BaseFieldMetaType { _id, Name, Type, ReadOnly?, Required?, Constraint?, DefaultValue? }
  ├─ StringFieldMetaType { Constraint: { Length?, Enum?, DefaultValue? }, View? }
  ├─ NumberFieldMetaType { Constraint: { IntegerPart?, FractionPart?, DefaultValue? } }
  ├─ BooleanFieldMetaType { Constraint: { DefaultValue? } }
  ├─ DateFieldMetaType { Constraint: { DefaultValue? } }
  ├─ DateTimeFieldMetaType { Constraint: { Precision?, DefaultValue? } }
  ├─ SelectFieldMetaType { Constraint: { Enum (required) } }
  ├─ ReferenceFieldMetaType { View: { DataObject, Fields, Search, Filter?, Sort? } }
  ├─ UserFieldMetaType { View: { BusinessEntity? } }
  ├─ TextFieldMetaType { Constraint: { Format? } }
  ├─ ArrayFieldMetaType { Property (element descriptor) }
  ├─ ObjectFieldMetaType { Property (nested props) }
  ├─ FileFieldMetaType (no extra)
  └─ ImageFieldMetaType (no extra)
```

### Accessor Type Hierarchy
```
BaseFieldAccessorType<T> { label, required, readOnly, defaultValue, meta, get(), getOrDefault(), validate() }
  ├─ EditableFieldAccessorType<T> extends Base + { set() }
  ├─ ReadonlyFieldAccessorType<T> = Base (no set)
  ├─ EditableImageFieldAccessorType extends Editable + { upload(), getDownloadUrl(), deleteAttachment() }
  ├─ ReadonlyImageFieldAccessorType extends Readonly + { getDownloadUrl() }
  ├─ EditableFileFieldAccessorType extends Editable + { upload(), getDownloadUrl(), getDownloadUrls(), deleteAttachment() }
  └─ ReadonlyFileFieldAccessorType extends Readonly + { getDownloadUrl(), getDownloadUrls() }
```

### Constants (sdk/types/constants.ts)
All exported as `as const` objects with derived types:
- ConditionOperator (16 values), GroupOperator (3), RHSType (3)
- SortDirection (2), MetricType (10), QueryType (3)
- FormOperation (2), InteractionMode (2), ValidationMode (5)
- BdoFieldType (14), FormInputType (12), OptionsMode (2)
- AuthStatus (3), AuthProviderName (4)
- SystemField (7), HttpMethod (4), DateEncodingKey (2), DeleteStatus (1)
- Defaults: { SEARCH_DEBOUNCE_MS: 300, PAGE_SIZE: 10, PAGE: 1, SEARCH_MAX_LENGTH: 255 }

---

## 10. WORKFLOW-SPECIFIC INTERNALS

### createFieldFromMeta (`sdk/workflow/createFieldFromMeta.ts`)
Runtime field factory — creates field instances from metadata:
- String + Constraint.Enum → SelectField
- Switch: String→StringField, Number→NumberField, Boolean→BooleanField, Date→DateField, DateTime→DateTimeField, Text→TextField, Reference→ReferenceField, User→UserField, File→FileField, default→StringField

### buildFieldsFromInput(input)
Iterates activity Input metadata entries, calls createFieldFromMeta for each.

### findFieldInBpActivities(currentActivityDef, bpSchema, fieldName)
Searches other activities in same BP for field definitions (Context-derived readonly fields).

### ActivityInstanceFieldsType (system fields on every activity instance)
```typescript
{ _id: string, BPInstanceId: string, Status: "InProgress"|"Completed", AssignedTo: {_id,Type}[], CompletedAt: DateTimeFieldType }
```

---

## 11. VALIDATION DETAILS

### Constraint Validation (`createResolver.ts → validateConstraints()`)
- **Required**: value is undefined/null/""/empty array → error (returns early)
- **String length**: `value.length > field.length` → error
- **Number precision**: Checks integerPart (digits before decimal) and fractionPart (digits after)

### coerceFieldValue (useBDOForm/shared — used by both useBDOForm + useActivityForm)
- Number: empty string → undefined, else Number(value)
- Date/DateTime: empty string → undefined
- DateTime: normalizes format, appends "Z", handles missing seconds

### coerceRecordForForm (useBDOForm/shared — used by both hooks)
- Strips trailing "Z" from DateTime values for HTML datetime-local input compatibility
