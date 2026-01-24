// ============================================================
// TYPE DEFINITIONS FOR useForm HOOK
// ============================================================

import type {
  UseFormRegister,
  Mode,
  FieldValues as RHFFieldValues,
  FieldErrors,
  Path,
  PathValue,
  RegisterOptions,
  SetValueConfig,
} from "react-hook-form";

// ============================================================
// CUSTOM HANDLE SUBMIT TYPE
// ============================================================

/**
 * HandleSubmit follows React Hook Form's signature pattern
 *
 * - onSuccess: Called with the API response data on successful submission
 * - onError: Called with either FieldErrors (validation failed) or Error (API failed)
 *
 * Internal flow:
 * 1. RHF validation + Cross-field validation → FAILS → onError(fieldErrors)
 * 2. Clean data & call API → FAILS → onError(apiError)
 * 3. SUCCESS → onSuccess(responseData)
 */
export type HandleSubmitType<T extends RHFFieldValues> = (
  onSuccess?: (data: T, e?: React.BaseSyntheticEvent) => void | Promise<void>,
  onError?: (
    error: FieldErrors<T> | Error,
    e?: React.BaseSyntheticEvent
  ) => void | Promise<void>
) => (e?: React.BaseSyntheticEvent) => Promise<void>;

// ============================================================
// EXPRESSION TREE TYPES
// ============================================================

/**
 * Expression tree node types from backend validation system
 * Used for evaluating validation rules, computed fields, and default values
 */
export interface ExpressionTreeType {
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
  Arguments?: ExpressionTreeType[];
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

// ============================================================
// SCHEMA DEFINITION TYPES (BDO - Business Data Object)
// ============================================================

/**
 * Validation rule from BDO schema
 * Defines a validation, computation, or business logic rule
 */
export interface SchemaValidationRuleType {
  Id: string;
  Name: string;
  Description: string;
  Expression: string;
  ExpressionTree: ExpressionTreeType;
  ResultType: string;
  Message?: string;
}

/**
 * Formula definition for computed fields
 */
export interface ComputedFieldFormulaType {
  Id?: string;
  Name?: string;
  Description?: string;
  Expression: string;
  ExpressionTree: ExpressionTreeType;
  ResultType?: string;
}

/**
 * Default value expression for a field
 */
export interface DefaultValueExpressionType {
  Expression: string;
  ExpressionTree: ExpressionTreeType;
}

/**
 * Reference field configuration for dynamic lookups
 */
export interface ReferenceFieldConfigType {
  Mode: "Dynamic" | "Static";
  Reference?: {
    BusinessObject: string;
    Fields: string[];
    Filters?: {
      Condition: Array<{
        LhsField: string;
        Operator: string;
        RhsType: string;
        RhsValue?: DefaultValueExpressionType;
      }>;
    };
    Sort?: Array<{
      Field: string;
      Order: "ASC" | "DESC";
    }>;
  };
}

/**
 * Field options configuration for select/dropdown fields
 */
export interface FieldOptionsConfigType {
  Mode: "Static" | "Dynamic";
  Items?: Array<{
    Value: string | number | boolean;
    Label: string;
  }>;
  Reference?: ReferenceFieldConfigType["Reference"];
}

/**
 * BDO field definition structure
 */
export interface BDOFieldDefinitionType {
  Id: string;
  Name: string;
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
  DefaultValue?: DefaultValueExpressionType;
  Formula?: ComputedFieldFormulaType;
  Computed?: boolean;
  Validation?: string[] | SchemaValidationRuleType[]; // Array of rule IDs OR inline validation rule objects
  Values?: FieldOptionsConfigType;
  Items?: {
    Type: string;
    Property?: Record<string, BDOFieldDefinitionType>;
  };
  Property?: Record<string, BDOFieldDefinitionType>;
  Description?: string;
}

/**
 * Business Object Rule definitions from BDO schema
 */
export interface BusinessObjectRulesType {
  Computation?: Record<string, SchemaValidationRuleType>;
  Validation?: Record<string, SchemaValidationRuleType>;
  BusinessLogic?: Record<string, SchemaValidationRuleType>;
}

/**
 * Role permission definition from BDO schema
 */
export interface RolePermissionType {
  Editable?: string[];
  ReadOnly?: string[];
  Methods?: string[];
  Filters?: {
    Operator: "AND" | "OR";
    Condition: Array<{
      LhsField: string;
      Operator: string;
      RhsType: "Literal" | "Field";
      RhsValue: any;
    }>;
  };
}

/**
 * Complete BDO (Business Data Object) schema structure
 */
export interface BDOSchemaType {
  Id: string;
  Name: string;
  Kind: "BusinessObject";
  Description: string;
  Rules: BusinessObjectRulesType;
  Fields: Record<string, BDOFieldDefinitionType>;
  RolePermission: Record<string, RolePermissionType>;
  Roles: Record<
    string,
    {
      Name: string;
      Description: string;
    }
  >;
}

// ============================================================
// FORM CONFIGURATION TYPES
// ============================================================

/**
 * Form operation mode
 */
export type FormOperationType = "create" | "update";

/**
 * Form interaction mode
 * - "interactive" (default): Real-time server-side validation and computation on every field blur
 * - "non-interactive": Draft only for computed field dependencies (legacy behavior)
 */
export type InteractionModeType = "interactive" | "non-interactive";

/**
 * Form validation mode (from react-hook-form)
 */
export type FormModeType = Mode;

/**
 * Rule classification types
 */
export type RuleTypeType = "Validation" | "Computation" | "BusinessLogic";

/**
 * useForm hook options with strict typing
 */
export interface UseFormOptionsType<
  T extends Record<string, any> = Record<string, any>,
> {
  /** Data source identifier (Business Object name) */
  source: string;

  /** Form operation type */
  operation: FormOperationType;

  /** Record ID for update operations */
  recordId?: string;

  /** Default form values */
  defaultValues?: Partial<T>;

  /**
   * Validation mode - controls when validation runs and errors are displayed
   *
   * Available modes:
   * - "onSubmit" (default in react-hook-form): Validate only when form is submitted
   * - "onBlur" (default in useForm): Validate when field loses focus
   * - "onChange": Validate on every keystroke/change
   * - "onTouched": Validate on first blur, then on every change after
   * - "all": Validate on both blur and change
   *
   * **Important:** Computation (draft API calls) ALWAYS fires on blur regardless of mode,
   * but only if the field value is valid. In "onSubmit" mode, computation will fire
   * on blur since no validation has occurred yet (validation happens at submit time).
   *
   * @default "onBlur"
   * @see https://react-hook-form.com/docs/useform for more details on validation modes
   */
  mode?: FormModeType;

  /** Whether to enable schema fetching and form initialization (default: true) */
  enabled?: boolean;

  /** User role for permission enforcement */
  userRole?: string;

  /** Schema load error callback (separate concern from form submission) */
  onSchemaError?: (error: Error) => void;

  /** Skip schema fetching (use for testing) */
  skipSchemaFetch?: boolean;

  /** Manual schema (use instead of fetching) */
  schema?: BDOSchemaType;

  /**
   * Form interaction mode
   * - "interactive" (default): Real-time server-side validation and computation on every field blur
   * - "non-interactive": Draft only for computed field dependencies
   * @default "interactive"
   */
  interactionMode?: InteractionModeType;

  /**
   * Enable draft API calls in update mode
   * When false (default), no draft API calls (e.g., /instance_id/draft) are made during
   * field blur in update mode. The update API is only called on form submission.
   * When true, draft API calls are made on blur for computed field dependencies.
   * @default false
   */
  enableDraftInUpdateMode?: boolean;
}

// ============================================================
// FORM FIELD CONFIGURATION TYPES
// ============================================================

/**
 * Field permission for current user
 */
export interface FieldPermissionType {
  /** Can user edit this field */
  editable: boolean;

  /** Can user see this field */
  readable: boolean;

  /** Is field completely hidden */
  hidden: boolean;
}

/**
 * Field input types for form rendering
 */
export type FormFieldTypeType =
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

/**
 * Select option for dropdown fields
 */
export interface SelectOptionType {
  value: any;
  label: string;
}

/**
 * Field rule IDs by category
 */
export interface FieldRuleIdsType {
  validation: string[];
  computation: string[];
  businessLogic: string[];
}

/**
 * Form field configuration for rendering
 * Contains all metadata needed to render and validate a form field
 */
export interface FormFieldConfigType {
  /** Field name/identifier */
  name: string;

  /** Field input type */
  type: FormFieldTypeType;

  /** Display label */
  label: string;

  /** Whether field is required */
  required: boolean;

  /** Whether field is computed (read-only, auto-calculated) */
  computed: boolean;

  /** Default value */
  defaultValue?: any;

  /** Select options (for select/reference fields) */
  options?: SelectOptionType[];

  /** Validation configuration */
  validation: any;

  /** Field description/help text */
  description?: string;

  /** Original BDO field definition (for advanced use) */
  _bdoField: BDOFieldDefinitionType;

  /** Field permissions for current user */
  permission: FieldPermissionType;

  /** Associated rule IDs by category */
  rules: FieldRuleIdsType;
}

/**
 * Form schema configuration after processing
 * Contains all fields and rules ready for form rendering
 */
export interface FormSchemaConfigType {
  /** All fields by name */
  fields: Record<string, FormFieldConfigType>;

  /** Field names in display order */
  fieldOrder: string[];

  /** Names of computed fields */
  computedFields: string[];

  /** Names of required fields */
  requiredFields: string[];

  /** Cross-field validation rules */
  crossFieldValidation: SchemaValidationRuleType[];

  /** Classified rules by type */
  rules: {
    validation: Record<string, SchemaValidationRuleType>;
    computation: Record<string, SchemaValidationRuleType>;
    businessLogic: Record<string, SchemaValidationRuleType>;
  };

  /** Field-to-rule mapping for quick lookup */
  fieldRules: Record<string, FieldRuleIdsType>;

  /** Role permissions */
  rolePermissions?: Record<string, RolePermissionType>;
}

// ============================================================
// HOOK RETURN TYPES
// ============================================================

/**
 * useForm hook return type with flattened state access and strict typing
 */
export interface UseFormReturnType<
  T extends Record<string, any> = Record<string, any>,
> {
  // ============================================================
  // FORM METHODS WITH STRICT TYPING
  // ============================================================

  /** Register field for validation and form handling with strict typing */
  register: <K extends Path<T>>(
    name: K,
    options?: RegisterOptions<T, K>
  ) => ReturnType<UseFormRegister<T>>;

  /**
   * Handle form submission with optional callbacks
   *
   * @example
   * // Basic usage - no callbacks
   * <form onSubmit={form.handleSubmit()}>
   *
   * @example
   * // With success callback
   * <form onSubmit={form.handleSubmit((data) => {
   *   toast.success("Saved!");
   *   navigate("/products/" + data._id);
   * })}>
   *
   * @example
   * // With both callbacks
   * <form onSubmit={form.handleSubmit(
   *   (data) => toast.success("Saved!"),
   *   (error) => {
   *     if (error instanceof Error) {
   *       toast.error(error.message); // API error
   *     } else {
   *       toast.error("Please fix the form errors"); // Validation errors
   *     }
   *   }
   * )}>
   *
   * @example
   * // Programmatic submission
   * await form.handleSubmit(onSuccess, onError)();
   */
  handleSubmit: HandleSubmitType<T>;

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
  // LOADING STATES
  // ============================================================

  /** True during initial load */
  isLoading: boolean;

  /** True during background operations */
  isFetching: boolean;

  // ============================================================
  // INTERACTIVE MODE STATE
  // ============================================================

  /** Draft ID for interactive create mode */
  draftId: string | null;

  /** Whether draft is being created (interactive create only) */
  isCreatingDraft: boolean;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  /** Schema fetch error */
  loadError: Error | null;

  /** Any error active */
  hasError: boolean;

  // ============================================================
  // SCHEMA INFORMATION WITH STRICT TYPING
  // ============================================================

  /** Raw BDO schema */
  schema: BDOSchemaType | null;

  /** Processed schema configuration for rendering */
  schemaConfig: FormSchemaConfigType | null;

  /** Computed field names as typed array */
  computedFields: Array<keyof T>;

  /** Required field names as typed array */
  requiredFields: Array<keyof T>;

  // ============================================================
  // FIELD HELPERS WITH STRICT TYPING
  // ============================================================

  /** Get field configuration with strict typing */
  getField: <K extends keyof T>(fieldName: K) => FormFieldConfigType | null;

  /** Get all field configurations with strict typing */
  getFields: () => Record<keyof T, FormFieldConfigType>;

  /** Check if field exists with strict typing */
  hasField: <K extends keyof T>(fieldName: K) => boolean;

  /** Check if field is required with strict typing */
  isFieldRequired: <K extends keyof T>(fieldName: K) => boolean;

  /** Check if field is computed with strict typing */
  isFieldComputed: <K extends keyof T>(fieldName: K) => boolean;

  // ============================================================
  // OPERATIONS
  // ============================================================

  /** Refresh schema */
  refreshSchema: () => Promise<void>;

  /** Validate form manually */
  validateForm: () => Promise<boolean>;

  /** Clear all errors */
  clearErrors: () => void;
}

// ============================================================
// RESULT TYPES
// ============================================================

/**
 * Expression evaluation context
 */
export interface ExpressionContextType<T = Record<string, any>> {
  /** Current form values */
  formValues: Partial<T>;

  /** System values (NOW, TODAY, CURRENT_USER, etc.) */
  systemValues: Record<string, any>;

  /** Reference data cache */
  referenceData: Record<string, any[]>;
}

/**
 * Field validation result
 */
export interface FieldValidationResultType<T = Record<string, any>> {
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
export interface SubmissionResultType {
  /** Was submission successful */
  success: boolean;

  /** Response data */
  data?: any;

  /** Error if submission failed */
  error?: Error;

  /** Created/updated record ID */
  recordId?: string;
}
