// ============================================================
// TYPE DEFINITIONS FOR useActivityForm HOOK
// ============================================================

import type {
  UseFormRegister,
  FieldErrors,
  Path,
  PathValue,
  RegisterOptions,
  SetValueConfig,
} from "react-hook-form";

import type {
  ExpressionTreeType,
  FormFieldTypeType,
  SelectOptionType,
  FormModeType,
  HandleSubmitType,
} from "../../../components/hooks/useForm/types";

// ============================================================
// ACTIVITY INPUT FIELD DEFINITIONS
// ============================================================

/**
 * Activity Input field definition — matches the JSON structure
 * in workflow BP definitions (e.g., EMPLOYEE_INPUT.Input)
 */
export interface ActivityInputFieldDefinition {
  Name: string;
  Type: "String" | "Number" | "Date" | "DateTime" | "Boolean" | "Reference";
  Constraint?: {
    Required?: boolean;
    Length?: number;
    IntegerPart?: number;
    Enum?: string[];
  };
  Formula?: {
    Expression: string;
    ExpressionTree: ExpressionTreeType;
  };
  View?: {
    DataObject: { Id: string; Type: string };
    Fields: Record<string, { Type: string }>;
    Filter?: any;
    Sort?: any;
    Search?: string[];
  };
}

/**
 * Map of field ID to definition (the Input object from Activity JSON)
 */
export type ActivityInputFields = Record<string, ActivityInputFieldDefinition>;

// ============================================================
// PROCESSED FIELD CONFIG
// ============================================================

/**
 * Processed field configuration for rendering — parallel to
 * FormFieldConfigType from useForm but adapted for activity fields.
 */
export interface ActivityFieldConfig {
  /** Field name/identifier */
  name: string;

  /** Field input type */
  type: FormFieldTypeType;

  /** Display label */
  label: string;

  /** Whether field is required */
  required: boolean;

  /** Whether field is computed (read-only, auto-calculated via Formula) */
  computed: boolean;

  /** Default value */
  defaultValue?: any;

  /** Select options (populated from Constraint.Enum) */
  options?: SelectOptionType[];

  /** react-hook-form validation rules */
  validation: any;

  /** Maximum length constraint */
  maxLength?: number;

  /** Original Activity Input field definition */
  _raw: ActivityInputFieldDefinition;
}

// ============================================================
// HOOK OPTIONS
// ============================================================

/**
 * useActivityForm hook options
 */
export interface UseActivityFormOptions<
  T extends Record<string, any> = Record<string, any>,
> {
  /** Business Process identifier */
  bp_id: string;

  /** Task identifier within the BP */
  task_id: string;

  /** Task instance identifier */
  task_instance_id: string;

  /** Activity Input field definitions — the Input object from the Activity JSON */
  fields: ActivityInputFields;

  /** Default form values */
  defaultValues?: Partial<T>;

  /**
   * Validation mode — controls when validation runs
   * @default "onBlur"
   */
  mode?: FormModeType;

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
export interface UseActivityFormReturn<
  T extends Record<string, any> = Record<string, any>,
> {
  // ============================================================
  // FORM METHODS
  // ============================================================

  /** Register field for validation and form handling */
  register: <K extends Path<T>>(
    name: K,
    options?: RegisterOptions<T, K>
  ) => ReturnType<UseFormRegister<T>>;

  /**
   * Handle form submission — calls activity.update() + activity.draftEnd()
   */
  handleSubmit: HandleSubmitType<T>;

  /**
   * Handle form completion — calls activity.complete()
   */
  handleComplete: HandleSubmitType<T>;

  /** Watch field values */
  watch: <K extends Path<T> | readonly Path<T>[]>(
    name?: K
  ) => K extends Path<T>
    ? PathValue<T, K>
    : K extends readonly Path<T>[]
      ? PathValue<T, K[number]>[]
      : T;

  /** Set field value programmatically */
  setValue: <K extends Path<T>>(
    name: K,
    value: PathValue<T, K>,
    options?: SetValueConfig
  ) => void;

  /** Reset form to default values */
  reset: (values?: T) => void;

  // ============================================================
  // FLATTENED FORM STATE
  // ============================================================

  /** Form validation errors */
  errors: FieldErrors<T>;

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
  // FIELD INFORMATION
  // ============================================================

  /** All processed field configs by name */
  fieldConfigs: Record<string, ActivityFieldConfig>;

  /** Computed field names */
  computedFields: Array<keyof T>;

  /** Required field names */
  requiredFields: Array<keyof T>;

  /** Get a single field config */
  getField: <K extends keyof T>(name: K) => ActivityFieldConfig | null;

  /** Get all field configs */
  getFields: () => Record<keyof T, ActivityFieldConfig>;

  /** Check if a field is required */
  isFieldRequired: <K extends keyof T>(name: K) => boolean;

  /** Check if a field is computed */
  isFieldComputed: <K extends keyof T>(name: K) => boolean;

  // ============================================================
  // OPERATIONS
  // ============================================================

  /** Clear all form errors */
  clearErrors: () => void;
}
