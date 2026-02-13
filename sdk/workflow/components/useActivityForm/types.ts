// ============================================================
// TYPE DEFINITIONS FOR useActivityForm HOOK
// ============================================================
// BDO-aligned types for the Activity pattern.
// Reuses shared types from useForm where identical.

import type {
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  UseFormReset,
  UseFormTrigger,
  Control,
  FieldErrors,
} from "react-hook-form";

import type { Activity } from "../../Activity";

// Reuse shared types from useForm — identical interfaces, no duplication
import type {
  HandleSubmitType,
  FormItemType,
  FormRegisterType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from "../../../components/hooks/useForm/types";

// Re-export for consumers who import from this module
export type {
  HandleSubmitType,
  FormItemType,
  FormRegisterType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
};

// ============================================================
// GENERIC EXTRACTION HELPERS
// ============================================================

/** Extract TEntity from an Activity instance */
export type ExtractActivityEntity<A> =
  A extends Activity<infer E, any, any> ? E : never;

/** Extract TEditable from an Activity instance */
export type ExtractActivityEditable<A> =
  A extends Activity<any, infer E, any> ? E : never;

/** Extract TReadonly from an Activity instance */
export type ExtractActivityReadonly<A> =
  A extends Activity<any, any, infer R> ? R : never;

/** All accessible fields (editable + readonly) */
export type AllActivityFields<A> =
  ExtractActivityEditable<A> & ExtractActivityReadonly<A>;

// ============================================================
// HOOK OPTIONS
// ============================================================

/**
 * useActivityForm hook options.
 *
 * The Activity instance already carries businessProcessId, activityId, and field definitions.
 * Options only contain runtime configuration.
 */
export interface UseActivityFormOptions<A extends Activity<any, any, any>> {
  /** Activity instance identifier */
  activity_instance_id: string;

  /** Default form values */
  defaultValues?: Partial<ExtractActivityEditable<A>>;

  /**
   * Validation mode — controls when validation runs
   * @default "onBlur"
   */
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";

  /**
   * Whether to enable activity.read() on mount
   * @default true
   */
  enabled?: boolean;
}

// ============================================================
// HOOK RETURN TYPE
// ============================================================

/**
 * useActivityForm hook return type — mirrors useForm return structure
 */
export interface UseActivityFormReturn<A extends Activity<any, any, any>> {
  /** Item proxy with typed field accessors */
  item: FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>;

  /** The Activity instance */
  activity: A;

  /** Smart register with auto-disable for readonly fields */
  register: FormRegisterType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>;

  /** Handle form submission — calls activity.update() + activity.draftEnd() */
  handleSubmit: HandleSubmitType<AllActivityFields<A>>;

  /** Handle form completion — calls activity.complete() */
  handleComplete: HandleSubmitType<AllActivityFields<A>>;

  /** Watch field values */
  watch: UseFormWatch<AllActivityFields<A>>;

  /** Set field value programmatically */
  setValue: UseFormSetValue<ExtractActivityEditable<A>>;

  /** Get current field values */
  getValues: UseFormGetValues<AllActivityFields<A>>;

  /** Reset form to default values */
  reset: UseFormReset<AllActivityFields<A>>;

  /** Trigger validation for specific fields or all fields */
  trigger: UseFormTrigger<AllActivityFields<A>>;

  /** RHF control object (for Controller components) */
  control: Control<AllActivityFields<A>>;

  // ============================================================
  // FLATTENED FORM STATE
  // ============================================================

  /** Form validation errors */
  errors: FieldErrors<AllActivityFields<A>>;

  /** Form is valid */
  isValid: boolean;

  /** Form has been modified */
  isDirty: boolean;

  /** Form is currently submitting (save or complete) */
  isSubmitting: boolean;

  /** Form submission was successful */
  isSubmitSuccessful: boolean;

  // ============================================================
  // LOADING STATES
  // ============================================================

  /** True during activity.read() */
  isLoading: boolean;

  /** Schema/data load error */
  loadError: Error | null;

  /** Any error active */
  hasError: boolean;

  // ============================================================
  // OPERATIONS
  // ============================================================

  /** Clear all form errors */
  clearErrors: () => void;
}
