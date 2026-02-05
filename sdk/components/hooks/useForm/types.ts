import type {
  UseFormRegisterReturn,
  RegisterOptions,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  UseFormReset,
  UseFormTrigger,
  Control,
  FormState,
  FieldErrors,
} from "react-hook-form";
import type { BaseBdo, FieldMeta, ValidationResult } from "../../../bdo";
import type { SystemFieldsType } from "../../../types/base-fields";

// ============================================================
// GENERIC EXTRACTION HELPERS
// ============================================================

/** Extract TEditable from a BaseBdo instance */
export type ExtractEditable<B> = B extends BaseBdo<any, infer E, any> ? E : never;

/** Extract TReadonly from a BaseBdo instance */
export type ExtractReadonly<B> = B extends BaseBdo<any, any, infer R> ? R : never;

/** All accessible fields (editable + readonly + system) for RHF internal use */
export type AllFields<B> = ExtractEditable<B> & ExtractReadonly<B> & SystemFieldsType;

// ============================================================
// HANDLE SUBMIT TYPE
// ============================================================

/**
 * Custom handleSubmit that handles API calls automatically
 *
 * - onSuccess: Called with API response on successful submission
 * - onError: Called with FieldErrors (validation) or Error (API)
 */
export type HandleSubmitType<TRead = unknown> = (
  onSuccess?: (
    data: TRead,
    e?: React.BaseSyntheticEvent,
  ) => void | Promise<void>,
  onError?: (
    error: FieldErrors | Error,
    e?: React.BaseSyntheticEvent,
  ) => void | Promise<void>,
) => (e?: React.BaseSyntheticEvent) => Promise<void>;

// ============================================================
// OPTIONS TYPE
// ============================================================

export interface UseFormOptions<B extends BaseBdo<any, any, any>> {
  bdo: B;
  recordId?: string;
  operation?: "create" | "update";
  defaultValues?: Partial<ExtractEditable<B>>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  enableDraft?: boolean;
}

// ============================================================
// FORM FIELD ACCESSORS
// ============================================================

export interface EditableFormFieldAccessor<T> {
  readonly meta: FieldMeta;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResult;
}

export interface ReadonlyFormFieldAccessor<T> {
  readonly meta: FieldMeta;
  get(): T | undefined;
  validate(): ValidationResult;
}

// ============================================================
// SMART REGISTER TYPE
// ============================================================

/**
 * Single register() that auto-disables readonly fields.
 * For readonly fields, returns { disabled: true } in addition to the standard register result.
 */
export type SmartRegister<TEditable, TReadonly> = <
  K extends keyof TEditable | keyof TReadonly | string
>(
  name: K & string,
  options?: RegisterOptions
) => K extends keyof TReadonly
  ? UseFormRegisterReturn & { disabled: true }
  : UseFormRegisterReturn;

// ============================================================
// FORM ITEM TYPE
// ============================================================

export type SmartFormItem<
  TEditable extends Record<string, unknown>,
  TReadonly extends Record<string, unknown>,
> = {
  [K in keyof TEditable]: EditableFormFieldAccessor<TEditable[K]>;
} & {
  [K in keyof TReadonly]: ReadonlyFormFieldAccessor<TReadonly[K]>;
} & {
  readonly _id: string | undefined;
  toJSON(): Partial<TEditable & TReadonly>;
  validate(): Promise<boolean>;
};

// ============================================================
// RETURN TYPE
// ============================================================

export interface UseFormReturn<B extends BaseBdo<any, any, any>> {
  // Item with typed accessors
  item: SmartFormItem<ExtractEditable<B>, ExtractReadonly<B>>;

  // BDO reference
  bdo: B;
  operation: "create" | "update";
  recordId?: string;

  // Smart register with auto-disable for readonly fields
  register: SmartRegister<ExtractEditable<B>, ExtractReadonly<B>>;

  // Custom handleSubmit (handles API call + auto-filters payload)
  handleSubmit: HandleSubmitType;

  // RHF methods
  watch: UseFormWatch<AllFields<B>>;
  setValue: UseFormSetValue<ExtractEditable<B>>;
  getValues: UseFormGetValues<AllFields<B>>;
  reset: UseFormReset<AllFields<B>>;
  trigger: UseFormTrigger<AllFields<B>>;
  control: Control<AllFields<B>>;

  // RHF state (flattened)
  formState: FormState<AllFields<B>>;
  errors: FieldErrors<AllFields<B>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
  dirtyFields: Partial<Record<keyof AllFields<B>, boolean>>;

  // Loading
  isLoading: boolean;
  isFetching: boolean;

  // Error
  loadError: Error | null;

  // Draft (optional)
  draftId?: string;
  isCreatingDraft?: boolean;
}
