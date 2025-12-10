// ============================================================
// TYPE DEFINITIONS FOR useForm HOOK
// ============================================================

import type {
  UseFormRegister,
  Mode,
  FieldValues as RHFFieldValues,
  SubmitHandler,
  SubmitErrorHandler,
  FieldErrors,
  Path,
  PathValue,
  RegisterOptions,
  SetValueConfig,
  FormState,
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
 * useForm hook options with strict typing
 */
export interface UseFormOptions<T extends Record<string, any> = Record<string, any>> {
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

  /** Whether to enable schema fetching and form initialization (default: true) */
  enabled?: boolean;

  /** Success callback */
  onSuccess?: (data: T) => void;

  /** Error callback */
  onError?: (error: Error) => void;

  /** Schema load error callback */
  onSchemaError?: (error: Error) => void;

  /** Submit error callback */
  onSubmitError?: (error: Error) => void;

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
 * useForm hook return type with flattened state access and strict typing
 */
export interface UseFormReturn<T extends Record<string, any> = Record<string, any>> {
  // ============================================================
  // FORM METHODS WITH STRICT TYPING
  // ============================================================

  /** Register field for validation and form handling with strict typing */
  register: <K extends Path<T>>(
    name: K,
    options?: RegisterOptions<T, K>
  ) => ReturnType<UseFormRegister<T>>;

  /** Handle form submission - automatically uses SDK's submit logic */
  handleSubmit: () => (e?: React.BaseSyntheticEvent) => Promise<void>;

  /** Watch field values with strict typing */
  watch: <K extends Path<T> | readonly Path<T>[]>(
    name?: K
  ) => K extends Path<T> 
    ? PathValue<T, K> 
    : K extends readonly Path<T>[]
    ? PathValue<T, K[number]>[] 
    : T;

  /** Set field value programmatically with strict typing */
  setValue: <K extends Path<T>>(
    name: K,
    value: PathValue<T, K>,
    options?: SetValueConfig
  ) => void;

  /** Reset form to default values */
  reset: (values?: T) => void;

  // ============================================================
  // FLATTENED FORM STATE (NO NESTED formState)
  // ============================================================

  /** Form validation errors - direct access */
  errors: FieldErrors<T>;

  /** Form is valid - direct access */
  isValid: boolean;

  /** Form has been modified - direct access */
  isDirty: boolean;

  /** Form is currently submitting - direct access */
  isSubmitting: boolean;

  /** Form submission was successful - direct access */
  isSubmitSuccessful: boolean;

  // ============================================================
  // BACKWARD COMPATIBILITY
  // ============================================================

  /** Form state object (for backward compatibility with existing components) */
  formState: FormState<T>;

  // ============================================================
  // LOADING STATES
  // ============================================================

  /** Loading initial schema/data */
  isLoadingInitialData: boolean;

  /** Loading record data for update */
  isLoadingRecord: boolean;

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
  // SCHEMA INFORMATION WITH STRICT TYPING
  // ============================================================

  /** Raw backend schema */
  schema: BackendSchema | null;

  /** Processed schema for rendering */
  processedSchema: ProcessedSchema | null;

  /** Computed field names as typed array */
  computedFields: Array<keyof T>;

  /** Required field names as typed array */
  requiredFields: Array<keyof T>;

  // ============================================================
  // FIELD HELPERS WITH STRICT TYPING
  // ============================================================

  /** Get field metadata with strict typing */
  getField: <K extends keyof T>(fieldName: K) => ProcessedField | null;

  /** Get all fields with strict typing */
  getFields: () => Record<keyof T, ProcessedField>;

  /** Check if field exists with strict typing */
  hasField: <K extends keyof T>(fieldName: K) => boolean;

  /** Check if field is required with strict typing */
  isFieldRequired: <K extends keyof T>(fieldName: K) => boolean;

  /** Check if field is computed with strict typing */
  isFieldComputed: <K extends keyof T>(fieldName: K) => boolean;


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
 * Expression evaluation context with strict typing
 */
export interface EvaluationContext<T = Record<string, any>> {
  /** Current form values */
  formValues: Partial<T>;

  /** System values (NOW, TODAY, CURRENT_USER, etc.) */
  systemValues: Record<string, any>;

  /** Reference data cache */
  referenceData: Record<string, any[]>;
}

/**
 * Validation result with strict typing
 */
export interface ValidationResult<T = Record<string, any>> {
  /** Is validation passing */
  isValid: boolean;

  /** Error message if validation fails */
  message?: string;

  /** Field name that caused error */
  fieldName?: keyof T;
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
