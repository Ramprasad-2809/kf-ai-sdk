# useActivityForm API Reference

```tsx
import { useActivityForm } from "@ram_28/kf-ai-sdk/workflow";
import type {
  UseActivityFormOptions,
  UseActivityFormReturn,
} from "@ram_28/kf-ai-sdk/workflow";
```

## Signature

```tsx
const form: UseActivityFormReturn<EmployeeInputActivity> = useActivityForm(
  activity: EmployeeInputActivity,
  options: UseActivityFormOptions<EmployeeInputActivity>,
);
```

First argument is the Activity instance (positional). Second argument is the options object.

## Options

`UseActivityFormOptions<A>`

- `activity_instance_id: string`
  - **Required**
  - Activity instance ID. From `workflow.start()` response or `getInProgressList()` rows.
- `defaultValues?: Partial<ExtractActivityEditable<A>>`
  - **Optional** · Defaults to `{}`
  - Initial form values before server data loads. Server data wins on merge.
- `mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all"`
  - **Optional** · Defaults to `"onBlur"`
  - RHF validation mode. Also controls when per-field server sync fires.
- `enabled?: boolean`
  - **Optional** · Defaults to `true`
  - Set `false` to defer `activity.read()` until the instance ID is available.

## Return Value

`UseActivityFormReturn<A>`

### Instance

- `item: FormItemType<TEditable, TReadonly>`
  - The current activity instance. Each field is an accessor with methods to read, write, and validate. See [Instance and Field Accessors](#instance-and-field-accessors).
- `activity: A`
  - The Activity instance passed to the hook.

### Form Methods

- `register: FormRegisterType<TEditable, TReadonly>`
  - Registers an input field. Auto-disables readonly fields (`{ disabled: true }`).
- `handleSubmit: HandleSubmitType<CreateUpdateResponseType>`
  - Validates, updates any remaining dirty fields, then completes the activity. See [handleSubmit](#handlesubmit).
- `watch: UseFormWatch<AllActivityFields<A>>`
  - Standard RHF `watch`. Typed to all fields (editable + readonly).
- `setValue: UseFormSetValue<ExtractActivityEditable<A>>`
  - Standard RHF `setValue`. Typed to editable fields only.
- `getValues: UseFormGetValues<AllActivityFields<A>>`
  - Returns all field values.
- `reset: UseFormReset<AllActivityFields<A>>`
  - Resets form to given values or defaults.
- `trigger: UseFormTrigger<AllActivityFields<A>>`
  - Manually triggers validation for specific or all fields.
- `control: Control<AllActivityFields<A>>`
  - RHF control for `Controller` components.

### Form State

- `errors: FieldErrors<AllActivityFields<A>>`
  - Validation errors by field name. Each entry has `type` and `message`.
- `isValid: boolean`
  - `true` if all fields pass validation.
- `isDirty: boolean`
  - `true` if any field has been modified.
- `isSubmitting: boolean`
  - `true` during `handleSubmit` (from button click to API response).
- `isSubmitSuccessful: boolean`
  - `true` after the last submission succeeded.

### Loading & Error

- `isLoading: boolean`
  - `true` during initial data + metadata loading. Guard form render on this.
- `isMetadataLoading: boolean`
  - `true` while BP metadata is being fetched.
- `loadError: Error | null`
  - Error from `activity.read()`.
- `hasError: boolean`
  - `true` when `loadError` is non-null.

### Other

- `bpMetadata: Record<string, unknown> | null`
  - Raw BP metadata blob. `null` while loading.
- `clearErrors: () => void`
  - Clear all form validation errors.

## handleSubmit

```typescript
type HandleSubmitType<TRead> = (
  onSuccess?: (data: TRead, e?: React.BaseSyntheticEvent) => void | Promise<void>,
  onError?: (error: FieldErrors | Error, e?: React.BaseSyntheticEvent) => void | Promise<void>,
) => (e?: React.BaseSyntheticEvent) => Promise<void>;
```

Curried function. Pass to an `onClick` handler: `onClick={handleSubmit(onSuccess, onError)}`.

**Behavior:**
1. Validates all fields via the resolver (type + constraint).
2. Collects dirty, non-readonly fields and sends them via `activity.update()`.
3. Calls `activity.complete()` to advance the workflow.
4. Invokes `onSuccess` with the complete response.

- `onSuccess(result, e?)`
  - Called with `CreateUpdateResponseType` (`{ _id: string }`) after the activity is completed and the workflow advances.
- `onError(error, e?)`
  - Called with `FieldErrors` if validation fails, or `Error` if the API call fails.

If no dirty fields exist, the update call is skipped but `complete()` is still called.

> Per-field sync handles auto-saving on blur/change. `handleSubmit` is for completing the activity, not saving drafts.

## Instance and Field Accessors

`item` represents the current activity instance. Each field on `item` is an accessor object.

### Instance Members (`item`)

- `_id: string | undefined`
  - Current activity instance ID.
- `toJSON(): Partial<TEditable & TReadonly>`
  - All form values as a plain object.
- `validate(): Promise<boolean>`
  - Triggers validation for all fields. Returns `true` if valid.

### Editable Field (`item.FieldName`)

- `get(): T | undefined`
  - Current value from form state.
- `getOrDefault(fallback: T): T`
  - Value or fallback if null/undefined.
- `set(value: T): void`
  - Sets the field value.
- `validate(): ValidationResultType`
  - Validates the current value. Returns `{ valid: boolean, errors: string[] }`.
- `label: string`
  - Display label from field metadata.
- `required: boolean`
  - Whether the field is required.
- `readOnly: boolean`
  - Always `false` for editable fields.
- `defaultValue: unknown`
  - Default value from metadata.
- `meta: BaseFieldMetaType`
  - Raw field metadata.

### Readonly Field (`item.FieldName`)

Same as editable except: no `set()` method, `readOnly` is always `true`.

## Types

```typescript
// ---- Generic extraction helpers ----

type ExtractActivityEntity<A> =
  A extends Activity<infer E, any, any> ? E : never;

type ExtractActivityEditable<A> =
  A extends Activity<any, infer E, any> ? E : never;

type ExtractActivityReadonly<A> =
  A extends Activity<any, any, infer R> ? R : never;

type AllActivityFields<A> =
  ExtractActivityEditable<A> & ExtractActivityReadonly<A>;

// ---- Hook options ----

interface UseActivityFormOptions<A extends Activity<any, any, any>> {
  activity_instance_id: string;
  defaultValues?: Partial<ExtractActivityEditable<A>>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  enabled?: boolean;
}

// ---- Hook return type ----

interface UseActivityFormReturn<A extends Activity<any, any, any>> {
  item: FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>;
  activity: A;

  register: FormRegisterType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>;
  handleSubmit: HandleSubmitType<CreateUpdateResponseType>;
  watch: UseFormWatch<AllActivityFields<A>>;
  setValue: UseFormSetValue<ExtractActivityEditable<A>>;
  getValues: UseFormGetValues<AllActivityFields<A>>;
  reset: UseFormReset<AllActivityFields<A>>;
  trigger: UseFormTrigger<AllActivityFields<A>>;
  control: Control<AllActivityFields<A>>;

  errors: FieldErrors<AllActivityFields<A>>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;

  isLoading: boolean;
  isMetadataLoading: boolean;
  loadError: Error | null;
  hasError: boolean;

  bpMetadata: Record<string, unknown> | null;
  clearErrors: () => void;
}

// ---- Shared types ----

type HandleSubmitType<TRead = unknown> = (
  onSuccess?: (
    data: TRead,
    e?: React.BaseSyntheticEvent,
  ) => void | Promise<void>,
  onError?: (
    error: FieldErrors | Error,
    e?: React.BaseSyntheticEvent,
  ) => void | Promise<void>,
) => (e?: React.BaseSyntheticEvent) => Promise<void>;

type FormRegisterType<TEditable, TReadonly> = <
  K extends keyof TEditable | keyof TReadonly | string
>(
  name: K & string,
  options?: RegisterOptions,
) => K extends keyof TReadonly
  ? UseFormRegisterReturn & { disabled: true }
  : UseFormRegisterReturn;

type FormItemType<TEditable, TReadonly> = {
  [K in keyof TEditable]: EditableFormFieldAccessorType<TEditable[K]>;
} & {
  [K in keyof TReadonly]: ReadonlyFormFieldAccessorType<TReadonly[K]>;
} & {
  readonly _id: string | undefined;
  toJSON(): Partial<TEditable & TReadonly>;
  validate(): Promise<boolean>;
};

interface EditableFormFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: false;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  set(value: T): void;
  validate(): ValidationResultType;
}

interface ReadonlyFormFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: true;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  validate(): ValidationResultType;
}

interface ValidationResultType {
  valid: boolean;
  errors: string[];
}
```
