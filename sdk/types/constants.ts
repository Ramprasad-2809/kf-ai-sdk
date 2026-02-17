// ============================================================
// SDK CONSTANTS
// Runtime constant values for all SDK operations
// ============================================================

// ============================================================
// FILTER & QUERY OPERATORS
// ============================================================

/**
 * Condition operators for individual filter conditions
 * Used in Condition.Operator
 *
 * @example
 * import { ConditionOperator } from "@ram_28/kf-ai-sdk/filter";
 *
 * const filter = {
 *   Operator: GroupOperator.And,
 *   Condition: [{
 *     LHSField: "price",
 *     Operator: ConditionOperator.GT,
 *     RHSValue: 100,
 *   }]
 * };
 */
export const ConditionOperator = {
  /** Equal */
  EQ: "EQ",
  /** Not Equal */
  NE: "NE",
  /** Greater Than */
  GT: "GT",
  /** Greater Than or Equal */
  GTE: "GTE",
  /** Less Than */
  LT: "LT",
  /** Less Than or Equal */
  LTE: "LTE",
  /** Value within range */
  Between: "Between",
  /** Value outside range */
  NotBetween: "NotBetween",
  /** Value in list */
  IN: "IN",
  /** Value not in list */
  NIN: "NIN",
  /** Field is empty/null */
  Empty: "Empty",
  /** Field is not empty */
  NotEmpty: "NotEmpty",
  /** String contains substring */
  Contains: "Contains",
  /** String does not contain substring */
  NotContains: "NotContains",
  /** Minimum string length */
  MinLength: "MinLength",
  /** Maximum string length */
  MaxLength: "MaxLength",
  /** Exact length (array) */
  Length: "Length",
} as const;

/**
 * Group/Logical operators for combining conditions
 * Used in ConditionGroup.Operator
 *
 * @example
 * import { GroupOperator } from "@ram_28/kf-ai-sdk/filter";
 *
 * const filter = {
 *   Operator: GroupOperator.And,
 *   Condition: [...]
 * };
 */
export const GroupOperator = {
  /** All conditions must match */
  And: "And",
  /** Any condition can match */
  Or: "Or",
  /** Negate the condition */
  Not: "Not",
} as const;

/**
 * RHS (Right-Hand Side) value types for filter conditions
 * Determines how RHSValue is interpreted
 *
 * @example
 * import { RHSType } from "@ram_28/kf-ai-sdk/filter";
 *
 * // Compare against a constant value
 * { RHSType: RHSType.Constant, RHSValue: 100 }
 *
 * // Compare against another field
 * { RHSType: RHSType.BDOField, RHSValue: "otherField" }
 */
export const RHSType = {
  /** Literal constant value */
  Constant: "Constant",
  /** Reference another BDO field */
  BDOField: "BDOField",
  /** Reference app variable */
  AppVariable: "AppVariable",
} as const;

// ============================================================
// SORT CONSTANTS
// ============================================================

/**
 * Sort direction for API queries
 *
 * @example
 * import { SortDirection } from "@ram_28/kf-ai-sdk/table";
 *
 * const sortConfig = [{ price: SortDirection.DESC }];
 */
export const SortDirection = {
  /** Ascending order */
  ASC: "ASC",
  /** Descending order */
  DESC: "DESC",
} as const;

// ============================================================
// METRIC/AGGREGATION CONSTANTS
// ============================================================

/**
 * Metric aggregation function types
 * Used in metric and pivot queries
 *
 * @example
 * import { MetricType } from "@ram_28/kf-ai-sdk/api";
 *
 * const metric = {
 *   Type: "Metric",
 *   Metric: [{ Field: "amount", Type: MetricType.Sum }]
 * };
 */
export const MetricType = {
  /** Sum of values */
  Sum: "Sum",
  /** Average of values */
  Avg: "Avg",
  /** Count of records */
  Count: "Count",
  /** Maximum value */
  Max: "Max",
  /** Minimum value */
  Min: "Min",
  /** Count of unique values */
  DistinctCount: "DistinctCount",
  /** Count of blank/null values */
  BlankCount: "BlankCount",
  /** Count of non-blank values */
  NotBlankCount: "NotBlankCount",
  /** Concatenate values */
  Concat: "Concat",
  /** Concatenate distinct values */
  DistinctConcat: "DistinctConcat",
} as const;

// ============================================================
// QUERY TYPE CONSTANTS
// ============================================================

/**
 * Query type for API requests
 */
export const QueryType = {
  /** List query */
  List: "List",
  /** Metric/aggregation query */
  Metric: "Metric",
  /** Pivot table query */
  Pivot: "Pivot",
} as const;

// ============================================================
// FORM CONSTANTS
// ============================================================

/**
 * Form operation type
 *
 * @example
 * import { FormOperation } from "@ram_28/kf-ai-sdk/form";
 *
 * const { handleSubmit } = useForm({
 *   source: "products",
 *   operation: FormOperation.Create,
 * });
 */
export const FormOperation = {
  /** Create new record */
  Create: "create",
  /** Update existing record */
  Update: "update",
} as const;

/**
 * Form interaction mode
 * Controls server-side validation and computation behavior
 *
 * @example
 * import { InteractionMode } from "@ram_28/kf-ai-sdk/form";
 *
 * const { handleSubmit } = useForm({
 *   source: "products",
 *   operation: "create",
 *   interactionMode: InteractionMode.Interactive,
 * });
 */
export const InteractionMode = {
  /** Real-time server-side validation and computation on every field blur */
  Interactive: "interactive",
  /** Draft only for computed field dependencies */
  NonInteractive: "non-interactive",
} as const;

/**
 * Form validation mode (from react-hook-form)
 *
 * @example
 * import { ValidationMode } from "@ram_28/kf-ai-sdk/form";
 *
 * const { handleSubmit } = useForm({
 *   source: "products",
 *   operation: "create",
 *   mode: ValidationMode.OnBlur,
 * });
 */
export const ValidationMode = {
  /** Validate on blur (default) */
  OnBlur: "onBlur",
  /** Validate on change */
  OnChange: "onChange",
  /** Validate on submit only */
  OnSubmit: "onSubmit",
  /** Validate on first blur, then on change */
  OnTouched: "onTouched",
  /** Validate on blur and change */
  All: "all",
} as const;

// ============================================================
// FIELD TYPE CONSTANTS
// ============================================================

/**
 * BDO field types from schema
 */
export const BdoFieldType = {
  /** Single-line text field */
  String: "String",
  /** Multi-line text field */
  Text: "Text",
  /** Numeric field */
  Number: "Number",
  /** Boolean field */
  Boolean: "Boolean",
  /** Date only field */
  Date: "Date",
  /** Date and time field */
  DateTime: "DateTime",
  /** Reference to another BDO */
  Reference: "Reference",
  /** User reference field */
  User: "User",
  /** Secret/password field */
  Secrets: "Secrets",
  /** Activity flow field */
  ActivityFlow: "ActivityFlow",
  /** Array field */
  Array: "Array",
  /** Object field */
  Object: "Object",
  /** File attachment field */
  File: "File",
  /** Image attachment field */
  Image: "Image",
} as const;

/**
 * Form input types for rendering
 */
export const FormInputType = {
  /** Text input */
  Text: "text",
  /** Number input */
  Number: "number",
  /** Email input */
  Email: "email",
  /** Password input */
  Password: "password",
  /** Date picker */
  Date: "date",
  /** DateTime picker */
  DateTimeLocal: "datetime-local",
  /** Checkbox */
  Checkbox: "checkbox",
  /** Select dropdown */
  Select: "select",
  /** Multi-line text */
  Textarea: "textarea",
  /** Reference field */
  Reference: "reference",
  /** File attachment */
  File: "file",
  /** Image attachment */
  Image: "image",
} as const;

/**
 * Options mode for select/reference fields
 */
export const OptionsMode = {
  /** Options fetched dynamically from API */
  Dynamic: "Dynamic",
  /** Options defined statically in schema */
  Static: "Static",
} as const;

// ============================================================
// AUTH CONSTANTS
// ============================================================

/**
 * Authentication status
 *
 * @example
 * import { AuthStatus } from "@ram_28/kf-ai-sdk/auth";
 *
 * const { status } = useAuth();
 * if (status === AuthStatus.Authenticated) {
 *   // User is logged in
 * }
 */
export const AuthStatus = {
  /** Auth state being determined */
  Loading: "loading",
  /** User is logged in */
  Authenticated: "authenticated",
  /** User is not logged in */
  Unauthenticated: "unauthenticated",
} as const;

/**
 * Auth provider names
 */
export const AuthProviderName = {
  Google: "google",
  Microsoft: "microsoft",
  GitHub: "github",
  Custom: "custom",
} as const;

// ============================================================
// SYSTEM FIELD CONSTANTS
// ============================================================

/**
 * System fields automatically managed by the backend
 * These fields should not be included in create/update payloads
 *
 * @example
 * import { SystemField } from "@ram_28/kf-ai-sdk/bdo";
 *
 * // Exclude system fields from form data
 * const editableFields = Object.keys(data).filter(
 *   key => !Object.values(SystemField).includes(key)
 * );
 */
export const SystemField = {
  /** Primary key */
  Id: "_id",
  /** Creation timestamp */
  CreatedAt: "_created_at",
  /** Last modified timestamp */
  ModifiedAt: "_modified_at",
  /** Creator user */
  CreatedBy: "_created_by",
  /** Last modifier user */
  ModifiedBy: "_modified_by",
  /** Record version */
  Version: "_version",
  /** Merge version */
  MergeVersion: "_m_version",
} as const;

// ============================================================
// HTTP METHOD CONSTANTS
// ============================================================

/**
 * HTTP methods for API requests
 */
export const HttpMethod = {
  /** GET request */
  GET: "GET",
  /** POST request */
  POST: "POST",
  /** PATCH request */
  PATCH: "PATCH",
  /** DELETE request */
  DELETE: "DELETE",
} as const;

// ============================================================
// DEFAULT VALUES
// ============================================================

/**
 * Default configuration values
 *
 * @example
 * import { Defaults } from "@ram_28/kf-ai-sdk/table";
 *
 * const pageSize = Defaults.PAGE_SIZE; // 10
 */
export const Defaults = {
  /** Debounce delay for search in milliseconds */
  SEARCH_DEBOUNCE_MS: 300,
  /** Default items per page */
  PAGE_SIZE: 10,
  /** Default page number (1-indexed) */
  PAGE: 1,
  /** Maximum search query length */
  SEARCH_MAX_LENGTH: 255,
} as const;

// ============================================================
// DATE ENCODING CONSTANTS
// ============================================================

/**
 * Date encoding keys used in API responses
 * API returns dates in encoded format: { "$__d__": "YYYY-MM-DD" }
 *
 * @example
 * import { DateEncodingKey } from "@ram_28/kf-ai-sdk/api";
 *
 * function isEncodedDate(value: unknown): value is { $__d__: string } {
 *   return typeof value === "object" && value !== null && DateEncodingKey.Date in value;
 * }
 */
export const DateEncodingKey = {
  /** Date encoded field key: { "$__d__": "YYYY-MM-DD" } */
  Date: "$__d__",
  /** DateTime encoded field key: { "$__dt__": unix_timestamp } */
  DateTime: "$__dt__",
} as const;

// ============================================================
// DELETE STATUS CONSTANTS
// ============================================================

/**
 * Delete operation status
 */
export const DeleteStatus = {
  /** Successful deletion */
  Success: "success",
} as const;
