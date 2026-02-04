import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  UseFormReset,
  UseFormTrigger,
  Control,
  FormState,
  FieldErrors,
  FieldValues,
} from "react-hook-form";
import type { BaseBdo, FieldMeta, ValidationResult } from "../../../bdo";

// ============================================================
// HANDLE SUBMIT TYPE
// ============================================================

/**
 * Custom handleSubmit that handles API calls automatically
 *
 * - onSuccess: Called with API response on successful submission
 * - onError: Called with FieldErrors (validation) or Error (API)
 */
export type HandleSubmitType<TRead> = (
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

export interface UseBdoFormOptions<TEntity extends FieldValues> {
  bdo: BaseBdo<TEntity, any, any, any>;
  recordId?: string;
  operation?: "create" | "update";
  defaultValues?: Partial<TEntity>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  enableDraft?: boolean;
}

// ============================================================
// FORM FIELD ACCESSOR
// ============================================================

export interface FormFieldAccessor<T> {
  readonly meta: FieldMeta;
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResult;
}

// ============================================================
// FORM ITEM TYPE
// ============================================================

export type FormItem<T extends FieldValues> = {
  [K in keyof T as K extends "_id" ? never : K]: FormFieldAccessor<T[K]>;
} & {
  readonly _id: string | undefined;
  toJSON(): Partial<T>;
  validate(): Promise<boolean>;
};

// ============================================================
// RETURN TYPE
// ============================================================

export interface UseBdoFormReturn<
  TEntity extends FieldValues,
  TRead = TEntity,
> {
  // Item
  item: FormItem<TEntity>;

  // BDO
  bdo: BaseBdo<TEntity, any, any, any>;
  operation: "create" | "update";
  recordId?: string;

  // Custom handleSubmit (handles API call)
  handleSubmit: HandleSubmitType<TRead>;

  // RHF methods (except handleSubmit - we override it)
  register: UseFormRegister<TEntity>;
  watch: UseFormWatch<TEntity>;
  setValue: UseFormSetValue<TEntity>;
  getValues: UseFormGetValues<TEntity>;
  reset: UseFormReset<TEntity>;
  trigger: UseFormTrigger<TEntity>;
  control: Control<TEntity>;

  // RHF state (flattened)
  formState: FormState<TEntity>;
  errors: FieldErrors<TEntity>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
  dirtyFields: Partial<Record<keyof TEntity, boolean>>;

  // Loading
  isLoading: boolean;
  isFetching: boolean;

  // Error
  loadError: Error | null;

  // Draft (optional)
  draftId?: string;
  isCreatingDraft?: boolean;
}
