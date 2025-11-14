// ============================================================
// TYPE DEFINITIONS FOR useForm HOOK
// ============================================================

import type {
  FormState,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormReset,
  Mode,
  FieldValues as RHFFieldValues,
  SubmitHandler,
  SubmitErrorHandler,
} from "react-hook-form";

// ============================================================
// CUSTOM HANDLE SUBMIT TYPE
// ============================================================

/**
 * Extended handleSubmit that allows optional callbacks
 * When no callback is provided, uses the SDK's built-in submit function
 */
export type ExtendedHandleSubmit<T extends RHFFieldValues> = {
  (
    onValid?: SubmitHandler<T>,
    onInvalid?: SubmitErrorHandler<T>
  ): (e?: React.BaseSyntheticEvent) => Promise<void>;
};

// ============================================================
// BACKEND SCHEMA TYPES
// ============================================================

/**
 * Expression tree node types from backend validation system
 */
export interface ExpressionTree {
  Type:
    | "BinaryExpression"
    | "LogicalExpression"
    | "CallExpression"
    | "MemberExpression"
    | "AssignmentExpression"
    | "SystemIdentifier"
    | "Identifier"
    | "Literal";
  Operator?: string;
  Callee?: string;
  Arguments?: ExpressionTree[];
  Name?: string;
  Source?: string;
  Property?: {
    Name: string;
    Property?: {
      Name: string;
    };
  };
  Value?: any;
}

/**
 * Backend validation rule structure
 */
export interface ValidationRule {
  Id: string;
  Type: "Expression";
  Condition: {
    Expression: string;
    ExpressionTree: ExpressionTree;
  };
  Message: string;
}

/**
 * Backend formula structure for computed fields
 */
export interface Formula {
  Expression: string;
  ExpressionTree: ExpressionTree;
}

/**
 * Backend default value structure
 */
export interface DefaultValue {
  Expression: string;
  ExpressionTree: ExpressionTree;
}

/**
 * Backend reference field configuration
 */
export interface ReferenceField {
  Mode: "Dynamic" | "Static";
  Reference?: {
    BusinessObject: string;
    Fields: string[];
    Filters?: {
      Condition: Array<{
        LhsField: string;
        Operator: string;
        RhsType: string;
        RhsValue?: DefaultValue;
      }>;
    };
    Sort?: Array<{
      Field: string;
      Order: "ASC" | "DESC";
    }>;
  };
}

/**
 * Backend values configuration for select fields
 */
export interface FieldValues {
  Mode: "Static" | "Dynamic";
  Items?: Array<{
    Value: string | number | boolean;
    Label: string;
  }>;
  Reference?: ReferenceField["Reference"];
}

/**
 * Backend field definition structure
 */
export interface BackendFieldDefinition {
  Type:
    | "String"
    | "Number"
    | "Boolean"
    | "Date"
    | "DateTime"
    | "Reference"
    | "Array"
    | "Object"
    | "ActivityFlow";
  Required?: boolean;
  Unique?: boolean;
  DefaultValue?: DefaultValue;
  Formula?: Formula;
  Computed?: boolean;
  Validation?: ValidationRule[];
  Values?: FieldValues;
  Items?: {
    Type: string;
    Property?: Record<string, BackendFieldDefinition>;
  };
  Property?: Record<string, BackendFieldDefinition>;
  Description?: string;
}

/**
 * Complete backend schema response structure
 */
export interface BackendSchema {
  [fieldName: string]: BackendFieldDefinition;
}

// ============================================================
// FORM CONFIGURATION TYPES
// ============================================================

/**
 * Form operation mode
 */
export type FormOperation = "create" | "update";

/**
 * Form validation mode (from react-hook-form)
 */
export type FormMode = Mode;

/**
 * useForm hook options
 */
export interface UseFormOptions<T extends RHFFieldValues = RHFFieldValues> {
  /** Data source identifier (Business Object name) */
  source: string;

  /** Form operation type */
  operation: FormOperation;

  /** Record ID for update operations */
  recordId?: string;

  /** Default form values */
  defaultValues?: Partial<T>;

  /** Validation mode */
  mode?: FormMode;

  /** Success callback */
  onSuccess?: (data: T) => void;

  /** Error callback */
  onError?: (error: Error) => void;

  /** Schema load error callback */
  onSchemaError?: (error: Error) => void;

  /** Submit error callback */
  onSubmitError?: (error: Error) => void;

  /** Custom validation rules (merged with backend rules) */
  customValidation?: Record<keyof T, any>;

  /** Whether to enable schema fetching and form initialization (default: true) */
  enabled?: boolean;

  /** Skip schema fetching (use for testing) */
  skipSchemaFetch?: boolean;

  /** Manual schema (use instead of fetching) */
  schema?: BackendSchema;
}

// ============================================================
// PROCESSED FORM TYPES
// ============================================================

/**
 * Processed field metadata for form rendering
 */
export interface ProcessedField {
  /** Field name */
  name: string;

  /** Field type */
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "date"
    | "datetime-local"
    | "checkbox"
    | "select"
    | "textarea"
    | "reference";

  /** Field label (derived from name or schema) */
  label: string;

  /** Whether field is required */
  required: boolean;

  /** Whether field is computed (read-only) */
  computed: boolean;

  /** Default value */
  defaultValue?: any;

  /** Select options (for select/reference fields) */
  options?: Array<{
    value: any;
    label: string;
  }>;

  /** Validation rules */
  validation: any;

  /** Field description/help text */
  description?: string;

  /** Backend field definition */
  backendField: BackendFieldDefinition;
}

/**
 * Form schema after processing
 */
export interface ProcessedSchema {
  /** All fields */
  fields: Record<string, ProcessedField>;

  /** Field names in order */
  fieldOrder: string[];

  /** Computed field names */
  computedFields: string[];

  /** Required field names */
  requiredFields: string[];

  /** Cross-field validation rules */
  crossFieldValidation: ValidationRule[];
}

// ============================================================
// HOOK RETURN TYPES
// ============================================================

/**
 * useForm hook return type
 */
export interface UseFormReturn<T extends RHFFieldValues = RHFFieldValues> {
  // ============================================================
  // REACT HOOK FORM INTEGRATION
  // ============================================================

  /** Register field for validation and form handling */
  register: UseFormRegister<T>;

  /**
   * Handle form submission - React Hook Form compatible
   * Can be called with optional callbacks, or without arguments to use SDK's auto-submit
   * @example
   * // Auto-submit using SDK logic
   * <form onSubmit={handleSubmit()}>
   *
   * // Custom callback
   * <form onSubmit={handleSubmit((data) => console.log(data))}>
   */
  handleSubmit: ExtendedHandleSubmit<T>;

  /** Form state (errors, validation, etc.) */
  formState: FormState<T>;

  /** Watch field values */
  watch: UseFormWatch<T>;

  /** Set field value programmatically */
  setValue: UseFormSetValue<T>;

  /** Reset form to default values */
  reset: UseFormReset<T>;

  // ============================================================
  // LOADING STATES
  // ============================================================

  /** Loading initial schema/data */
  isLoadingInitialData: boolean;

  /** Loading record data for update */
  isLoadingRecord: boolean;

  /** Submitting form */
  isSubmitting: boolean;

  /** Any loading state active */
  isLoading: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  /** Schema fetch error */
  loadError: Error | null;

  /** Form submission error */
  submitError: Error | null;

  /** Any error active */
  hasError: boolean;

  // ============================================================
  // SCHEMA INFORMATION
  // ============================================================

  /** Raw backend schema */
  schema: BackendSchema | null;

  /** Processed schema for rendering */
  processedSchema: ProcessedSchema | null;

  /** Computed field names */
  computedFields: string[];

  /** Required field names */
  requiredFields: string[];

  // ============================================================
  // FIELD HELPERS
  // ============================================================

  /** Get field metadata */
  getField: (fieldName: keyof T) => ProcessedField | null;

  /** Get all fields */
  getFields: () => Record<string, ProcessedField>;

  /** Check if field exists */
  hasField: (fieldName: keyof T) => boolean;

  /** Check if field is required */
  isFieldRequired: (fieldName: keyof T) => boolean;

  /** Check if field is computed */
  isFieldComputed: (fieldName: keyof T) => boolean;

  // ============================================================
  // OPERATIONS
  // ============================================================

  /** Submit form manually */
  submit: () => Promise<void>;

  /** Refresh schema */
  refreshSchema: () => Promise<void>;

  /** Validate form manually */
  validateForm: () => Promise<boolean>;

  /** Clear all errors */
  clearErrors: () => void;
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Expression evaluation context
 */
export interface EvaluationContext {
  /** Current form values */
  formValues: Record<string, any>;

  /** System values (NOW, TODAY, CURRENT_USER, etc.) */
  systemValues: Record<string, any>;

  /** Reference data cache */
  referenceData: Record<string, any>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is validation passing */
  isValid: boolean;

  /** Error message if validation fails */
  message?: string;

  /** Field name that caused error */
  fieldName?: string;
}

/**
 * Form submission result
 */
export interface SubmissionResult {
  /** Was submission successful */
  success: boolean;

  /** Response data */
  data?: any;

  /** Error if submission failed */
  error?: Error;

  /** Created/updated record ID */
  recordId?: string;
}
