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
import type { BaseBdo } from "../../../bdo";
import type { BaseFieldMetaType, BdoMetaType, ValidationResultType } from "../../../bdo/core/types";
import type { BaseField } from "../../../bdo/fields/BaseField";
import type { SystemFieldsType } from "../../../types/base-fields";

// ============================================================
// GENERIC EXTRACTION HELPERS
// ============================================================

/** Extract TEditable from a BaseBdo instance */
export type ExtractEditableType<B> = B extends BaseBdo<any, infer E, any> ? E : never;

/** Extract TReadonly from a BaseBdo instance */
export type ExtractReadonlyType<B> = B extends BaseBdo<any, any, infer R> ? R : never;

/** All accessible fields (editable + readonly + system) for RHF internal use */
export type AllFieldsType<B> = ExtractEditableType<B> & ExtractReadonlyType<B> & SystemFieldsType;

// ============================================================
// BDO CAPABILITY CONSTRAINTS
// ============================================================

/** Minimum BDO shape required for any useForm usage */
interface BaseBdoShape {
  readonly meta: BdoMetaType;
  getFields(): Record<string, BaseField<unknown>>;
  loadMetadata(metadata: unknown): void;
  hasMetadata(): boolean;
  validateFieldExpression(fieldId: string, value: unknown, allValues: Record<string, unknown>): ValidationResultType;
}

/** BDO that supports creating records */
export interface CreatableBdo<TEditable = any> extends BaseBdoShape {
  create(data: Partial<TEditable>): Promise<any>;
}

/** BDO that supports reading and updating records */
export interface UpdatableBdo<TEditable = any> extends BaseBdoShape {
  get(id: string): Promise<any>;
  update(id: string, data: Partial<TEditable>): Promise<any>;
}

/** BDO that supports both create and update */
export type FormBdo<TEditable = any> = CreatableBdo<TEditable> & UpdatableBdo<TEditable>;

/** BDO that supports interactive create (draft interaction during create) */
export interface InteractiveCreatableBdo<TEditable = any> extends CreatableBdo<TEditable> {
  draftInteraction(data: Partial<TEditable>): Promise<any>;
  draft(data: Partial<TEditable>): Promise<any>;
}

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

export type UseFormOptionsType<B extends BaseBdo<any, any, any>> =
  | UseFormCreateOptionsType<B>
  | UseFormUpdateOptionsType<B>
  | UseFormAutoOptionsType<B>;

/** Options when operation is explicitly "create" — BDO must have create() */
interface UseFormCreateOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B & CreatableBdo<ExtractEditableType<B>>;
  operation: "create";
  recordId?: undefined;
  defaultValues?: Partial<ExtractEditableType<B>>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  interactionMode?: "interactive" | "non-interactive";
  /** @deprecated Use interactionMode instead */
  enableDraft?: boolean;
  enableConstraintValidation?: boolean;
  enableExpressionValidation?: boolean;
}

/** Options when operation is explicitly "update" — BDO must have get() + update() */
interface UseFormUpdateOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B & UpdatableBdo<ExtractEditableType<B>>;
  operation: "update";
  recordId: string;
  defaultValues?: Partial<ExtractEditableType<B>>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  interactionMode?: "interactive" | "non-interactive";
  /** @deprecated Use interactionMode instead */
  enableDraft?: boolean;
  enableConstraintValidation?: boolean;
  enableExpressionValidation?: boolean;
}

/** Options when operation is auto-inferred — BDO must support both */
interface UseFormAutoOptionsType<B extends BaseBdo<any, any, any>> {
  bdo: B & FormBdo<ExtractEditableType<B>>;
  operation?: undefined;
  recordId?: string;
  defaultValues?: Partial<ExtractEditableType<B>>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  interactionMode?: "interactive" | "non-interactive";
  /** @deprecated Use interactionMode instead */
  enableDraft?: boolean;
  enableConstraintValidation?: boolean;
  enableExpressionValidation?: boolean;
}

// ============================================================
// FORM FIELD ACCESSORS
// ============================================================

export interface EditableFormFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResultType;
}

export interface ReadonlyFormFieldAccessorType<T> {
  readonly label: string;
  readonly required: boolean;
  readonly readOnly: boolean;
  readonly defaultValue: unknown;
  readonly meta: BaseFieldMetaType;
  get(): T | undefined;
  validate(): ValidationResultType;
}

// ============================================================
// SMART REGISTER TYPE
// ============================================================

/**
 * Single register() that auto-disables readonly fields.
 * For readonly fields, returns { disabled: true } in addition to the standard register result.
 */
export type FormRegisterType<TEditable, TReadonly> = <
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

export type FormItemType<
  TEditable extends Record<string, unknown>,
  TReadonly extends Record<string, unknown>,
> = {
  [K in keyof TEditable]: EditableFormFieldAccessorType<TEditable[K]>;
} & {
  [K in keyof TReadonly]: ReadonlyFormFieldAccessorType<TReadonly[K]>;
} & {
  readonly _id: string | undefined;
  toJSON(): Partial<TEditable & TReadonly>;
  validate(): Promise<boolean>;
};

// ============================================================
// RETURN TYPE
// ============================================================

export interface UseFormReturnType<B extends BaseBdo<any, any, any>> {
  // Item with typed accessors
  item: FormItemType<ExtractEditableType<B>, ExtractReadonlyType<B>>;

  // BDO reference
  bdo: B;
  operation: "create" | "update";
  recordId?: string;

  // Smart register with auto-disable for readonly fields
  register: FormRegisterType<ExtractEditableType<B>, ExtractReadonlyType<B>>;

  // Custom handleSubmit (handles API call + auto-filters payload)
  handleSubmit: HandleSubmitType;

  // RHF methods
  watch: UseFormWatch<AllFieldsType<B>>;
  setValue: UseFormSetValue<ExtractEditableType<B>>;
  getValues: UseFormGetValues<AllFieldsType<B>>;
  reset: UseFormReset<AllFieldsType<B>>;
  trigger: UseFormTrigger<AllFieldsType<B>>;
  control: Control<AllFieldsType<B>>;

  // RHF state (flattened)
  formState: FormState<AllFieldsType<B>>;
  errors: FieldErrors<AllFieldsType<B>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
  dirtyFields: Partial<Record<keyof AllFieldsType<B>, boolean>>;

  // Loading
  isLoading: boolean;
  isFetching: boolean;

  // Error
  loadError: Error | null;

  // Draft / Interactive mode
  draftId: string | undefined;
  isInitializingDraft: boolean;
  isInteracting: boolean;
  interactionError: Error | null;
}
