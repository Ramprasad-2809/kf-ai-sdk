# useBDOForm API Reference

```tsx
import { useBDOForm } from "@ram_28/kf-ai-sdk/form";
import type {
  UseBDOFormOptionsType,
  UseBDOFormReturnType,
} from "@ram_28/kf-ai-sdk/form/types";
```

## Signature

```tsx
const form: UseBDOFormReturnType<SellerProduct> = useBDOForm(options: UseBDOFormOptionsType<SellerProduct>);
```

## Options

`UseBDOFormOptionsType<B>`

- `bdo: B extends BaseBdo<any, any, any>`
  - **Required**
  - BDO instance. Must be memoized with `useMemo()`.
- `recordId: string | undefined`
  - **Optional** · Defaults to `undefined`
  - Record ID to edit. When present, the hook fetches the record and enters update mode. When absent, enters create mode.

## Return Value

`UseBDOFormReturnType<B>`

### Instance

- `item: FormItemType<TEditable, TReadonly>`
  - The current record instance. Each field is an accessor with methods to read, write, and validate. See [Instance and Field Accessors](#instance-and-field-accessors).
- `bdo: B`
  - The BDO instance passed in.

### Form Methods

- `register: FormRegisterType<TEditable, TReadonly>`
  - Registers an input field. Auto-disables readonly fields (`{ disabled: true }`).
- `handleSubmit: HandleSubmitType<CreateUpdateResponseType>`
  - Validates, calls API, invokes callbacks. See [handleSubmit](#handlesubmit).
- `watch: UseFormWatch<AllFieldsType<B>>`
  - Standard RHF `watch`. Typed to all fields (editable + readonly + system).
- `setValue: UseFormSetValue<ExtractEditableType<B>>`
  - Standard RHF `setValue`. Typed to editable fields only.
- `getValues: UseFormGetValues<AllFieldsType<B>>`
  - Returns all field values.
- `reset: UseFormReset<AllFieldsType<B>>`
  - Resets form to given values or defaults.
- `trigger: UseFormTrigger<AllFieldsType<B>>`
  - Manually triggers validation for specific or all fields.
- `control: Control<AllFieldsType<B>>`
  - RHF control for `Controller` components.

### Form State

- `formState: FormState<AllFieldsType<B>>`
  - Full RHF form state object.
- `errors: FieldErrors<AllFieldsType<B>>`
  - Validation errors by field name. Each entry has `type` and `message`.
- `isDirty: boolean`
  - `true` if any field has been modified.
- `isValid: boolean`
  - `true` if all fields pass validation.
- `isSubmitting: boolean`
  - `true` during submission (from button click to API response).
- `isSubmitSuccessful: boolean`
  - `true` after a successful submission.
- `dirtyFields: Partial<Record<keyof AllFieldsType<B>, boolean>>`
  - Which fields have been modified.

### Loading & Error

- `isLoading: boolean`
  - `true` while fetching the record (update mode) or creating the draft (create mode). Guard form render on this.
- `isFetching: boolean`
  - `true` during refetches in update mode (including background refetches).
- `loadError: Error | null`
  - Error from record fetch or draft creation.
- `draftId: string | undefined`
  - Draft record ID in create mode.
- `isCreatingDraft: boolean | undefined`
  - `true` while the initial draft is being created.

## handleSubmit

```typescript
type HandleSubmitType<TRead> = (
  onSuccess?: (data: TRead, e?: React.BaseSyntheticEvent) => void | Promise<void>,
  onError?: (error: FieldErrors | Error, e?: React.BaseSyntheticEvent) => void | Promise<void>,
) => (e?: React.BaseSyntheticEvent) => Promise<void>;
```

Curried function. Pass to `<form onSubmit={handleSubmit(onSuccess, onError)}>`.

- `onSuccess(data, e?)`
  - Called with `CreateUpdateResponseType` (`{ _id: string }`) after a successful API call.
- `onError(error, e?)`
  - Called with `FieldErrors` if validation fails, or `Error` if the API call fails.

## Instance and Field Accessors

`item` represents the current record. Each field on `item` is an accessor object.

### Instance Members (`item`)

- `_id: string | undefined`
  - Current record ID.
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
// Options
interface UseBDOFormOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B;
  recordId?: string;
}

// Return type
interface UseBDOFormReturnType<B extends BaseBdo<any, any, any>> {
  item: FormItemType<ExtractEditableType<B>, ExtractReadonlyType<B>>;
  bdo: B;

  register: FormRegisterType<ExtractEditableType<B>, ExtractReadonlyType<B>>;
  handleSubmit: HandleSubmitType<CreateUpdateResponseType>;
  watch: UseFormWatch<AllFieldsType<B>>;
  setValue: UseFormSetValue<ExtractEditableType<B>>;
  getValues: UseFormGetValues<AllFieldsType<B>>;
  reset: UseFormReset<AllFieldsType<B>>;
  trigger: UseFormTrigger<AllFieldsType<B>>;
  control: Control<AllFieldsType<B>>;

  formState: FormState<AllFieldsType<B>>;
  errors: FieldErrors<AllFieldsType<B>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
  dirtyFields: Partial<Record<keyof AllFieldsType<B>, boolean>>;

  isLoading: boolean;
  isFetching: boolean;
  loadError: Error | null;

  draftId?: string;
  isCreatingDraft?: boolean;
}

// handleSubmit signature
type HandleSubmitType<TRead = unknown> = (
  onSuccess?: (data: TRead, e?: React.BaseSyntheticEvent) => void | Promise<void>,
  onError?: (error: FieldErrors | Error, e?: React.BaseSyntheticEvent) => void | Promise<void>,
) => (e?: React.BaseSyntheticEvent) => Promise<void>;

// Instance type
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
  readonly readOnly: boolean;
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
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  getOrDefault(fallback: T): T;
  validate(): ValidationResultType;
}

// Smart register
type FormRegisterType<TEditable, TReadonly> = <
  K extends keyof TEditable | keyof TReadonly | string
>(
  name: K & string,
  options?: RegisterOptions,
) => K extends keyof TReadonly
  ? UseFormRegisterReturn & { disabled: true }
  : UseFormRegisterReturn;

// Helpers
type ExtractEditableType<B> = B extends BaseBdo<any, infer E, any> ? E : never;
type ExtractReadonlyType<B> = B extends BaseBdo<any, any, infer R> ? R : never;
type AllFieldsType<B> = ExtractEditableType<B> & ExtractReadonlyType<B> & SystemFieldsType;

interface ValidationResultType {
  valid: boolean;
  errors: string[];
}

interface CreateUpdateResponseType {
  _id: string;
}
```
