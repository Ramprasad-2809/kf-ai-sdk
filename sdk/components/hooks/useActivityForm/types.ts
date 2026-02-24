// ============================================================
// TYPE DEFINITIONS FOR useActivityForm HOOK
// ============================================================
// BDO-aligned types for the Activity pattern.
// Reuses shared types from useBDOForm where identical.

import type {
  UseFormWatch,
  UseFormSetValue,
  UseFormGetValues,
  UseFormReset,
  UseFormTrigger,
  Control,
  FieldErrors,
} from 'react-hook-form';

import type { Activity } from '../../../workflow/Activity';
import type { CreateUpdateResponseType } from '../../../types/common';

// Reuse shared types from useBDOForm — identical interfaces, no duplication
import type {
  HandleSubmitType,
  FormItemType,
  FormRegisterType,
  EditableFormFieldAccessorType,
  ReadonlyFormFieldAccessorType,
} from '../useBDOForm/types';

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
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

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
 * useActivityForm hook return type — mirrors useBDOForm return structure
 */
export interface UseActivityFormReturn<A extends Activity<any, any, any>> {
  /** Item proxy with typed field accessors */
  item: FormItemType<ExtractActivityEditable<A>, ExtractActivityReadonly<A>>;

  /** The Activity instance */
  activity: A;

  /** Smart register with auto-disable for readonly fields */
  register: FormRegisterType<
    ExtractActivityEditable<A>,
    ExtractActivityReadonly<A>
  >;

  /** Handle form submission — validates, updates dirty fields, then completes the activity */
  handleSubmit: HandleSubmitType<CreateUpdateResponseType>;

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

  /** Form is currently submitting */
  isSubmitting: boolean;

  /** Form submission was successful */
  isSubmitSuccessful: boolean;

  // ============================================================
  // LOADING STATES
  // ============================================================

  /** True during activity.read() or metadata fetch */
  isLoading: boolean;

  /** True while BP metadata and context schemas are loading */
  isMetadataLoading: boolean;

  /** Schema/data load error */
  loadError: Error | null;

  /** Any error active */
  hasError: boolean;

  // ============================================================
  // METADATA (optional — for consumers that need raw metadata)
  // ============================================================

  /** Raw BP metadata (BDOBlob) — available after metadata fetch completes */
  bpMetadata: Record<string, unknown> | null;

  // ============================================================
  // OPERATIONS
  // ============================================================

  /** Clear all form errors */
  clearErrors: () => void;
}
