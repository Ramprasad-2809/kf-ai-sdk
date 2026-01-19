/**
 * Sort direction for API queries (matching API spec)
 */
export type SortDirection = "ASC" | "DESC";

/**
 * Sort configuration: array of field-direction mappings
 * Format: [{ "fieldName": "ASC" }, { "anotherField": "DESC" }]
 */
export type SortOption = Record<string, SortDirection>;

/**
 * Sort configuration: array of sort options
 */
export type Sort = SortOption[];

/**
 * Condition operators for individual conditions (leaf nodes)
 * Used in Condition.Operator
 */
export type ConditionOperator =
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE"
  | "Between" | "NotBetween" | "IN" | "NIN"
  | "Empty" | "NotEmpty" | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

/**
 * Operators for combining conditions in a group (tree nodes)
 * Used in ConditionGroup.Operator
 */
export type ConditionGroupOperator = "And" | "Or" | "Not";

/**
 * RHS value type for filter conditions
 */
export type FilterRHSType = "Constant" | "BOField" | "AppVariable";

/**
 * Leaf condition (actual field comparison)
 */
export interface Condition {
  /** Optional ID for hook state management (omitted in API payload) */
  id?: string;
  /** Condition operator */
  Operator: ConditionOperator;
  /** Left-hand side field name */
  LHSField: string;
  /** Right-hand side value */
  RHSValue: any;
  /** Right-hand side type (optional, defaults to Constant) */
  RHSType?: FilterRHSType;
}

/**
 * Group combining conditions (recursive structure)
 */
export interface ConditionGroup {
  /** Optional ID for hook state management (omitted in API payload) */
  id?: string;
  /** Group operator (And, Or, Not) */
  Operator: ConditionGroupOperator;
  /** Nested conditions (can be Condition or ConditionGroup) */
  Condition: Array<Condition | ConditionGroup>;
}

/**
 * Root filter type (alias for ConditionGroup)
 */
export type Filter = ConditionGroup;

// ============================================================
// LEGACY TYPE ALIASES (for backwards compatibility)
// ============================================================

/**
 * @deprecated Use `Condition` instead
 */
export type FilterCondition = Condition;

/**
 * @deprecated Use `ConditionGroup` instead
 */
export type FilterLogical = ConditionGroup;

/**
 * @deprecated Use `ConditionGroupOperator` instead
 */
export type FilterOperator = ConditionGroupOperator;

/**
 * @deprecated Use `Condition | ConditionGroup` instead
 */
export type FilterNode = Condition | ConditionGroup;

/**
 * DateTime encoding format used by the API
 */
export interface DateTimeEncoded {
  $__dt__: number;
}

/**
 * Date encoding format used by the API  
 */
export interface DateEncoded {
  $__d__: string;
}

/**
 * Standard paginated list response
 * @template T - Type of items in the list
 */
export interface ListResponse<T> {
  /** Array of items for current page */
  Data: T[];
}

/**
 * Read API response wrapper
 * @template T - Type of the data object
 */
export interface ReadResponse<T> {
  /** The data object */
  Data: T;
}

/**
 * Create/Update API response
 */
export interface CreateUpdateResponse {
  /** ID of the created/updated record */
  _id: string;
}

/**
 * Delete API response
 */
export interface DeleteResponse {
  /** Status of the delete operation */
  status: "success";
}

/**
 * Count API response
 */
export interface CountResponse {
  /** Total count of matching records */
  Count: number;
}

/**
 * Options for list queries (API request format)
 */
export interface ListOptions {
  /** Query type (defaults to "List") */
  Type?: "List";

  /** Specific fields to return */
  Field?: string[];

  /** Filter criteria */
  Filter?: Filter;

  /** Sort configuration */
  Sort?: Sort;

  /** Search query (separate from filters) */
  Search?: string;

  /** Page number (1-indexed) */
  Page?: number;

  /** Records per page */
  PageSize?: number;
}

// ============================================================
// METRIC/AGGREGATE TYPES
// ============================================================

/**
 * Metric aggregation function types
 */
export type MetricType =
  | "Sum"
  | "Avg"
  | "Count"
  | "Max"
  | "Min"
  | "DistinctCount"
  | "BlankCount"
  | "NotBlankCount"
  | "Concat"
  | "DistinctConcat";

/**
 * Metric field configuration
 */
export interface MetricField {
  /** Field to aggregate */
  Field: string;
  /** Aggregation function type */
  Type: MetricType;
}

/**
 * Options for metric/aggregate queries
 */
export interface MetricOptions {
  /** Query type (always "Metric") */
  Type: "Metric";
  /** Fields to group by */
  GroupBy: string[];
  /** Metric definitions */
  Metric: MetricField[];
  /** Optional filter criteria */
  Filter?: Filter;
}

/**
 * Response from metric endpoint
 */
export interface MetricResponse {
  /** Aggregated data rows */
  Data: Record<string, any>[];
}

// ============================================================
// PIVOT TYPES
// ============================================================

/**
 * Pivot table header item (hierarchical)
 */
export interface PivotHeaderItem {
  /** Header key/label */
  Key: string;
  /** Child headers for nested grouping */
  Children?: PivotHeaderItem[] | null;
}

/**
 * Pivot response data structure
 */
export interface PivotResponseData {
  /** Row headers */
  RowHeader: PivotHeaderItem[];
  /** Column headers */
  ColumnHeader: PivotHeaderItem[];
  /** Value matrix [row][column] */
  Value: (number | string | null)[][];
}

/**
 * Options for pivot queries
 */
export interface PivotOptions {
  /** Query type (always "Pivot") */
  Type: "Pivot";
  /** Row dimension fields */
  Row: string[];
  /** Column dimension fields */
  Column: string[];
  /** Metric definitions */
  Metric: MetricField[];
  /** Optional filter criteria */
  Filter?: Filter;
}

/**
 * Response from pivot endpoint
 */
export interface PivotResponse {
  /** Pivot data including headers and values */
  Data: PivotResponseData;
}

// ============================================================
// DRAFT/INTERACTIVE TYPES
// ============================================================

/**
 * Response from draft operations
 */
export interface DraftResponse {
  /** Computed field values */
  [fieldName: string]: any;
}

// ============================================================
// FIELDS METADATA TYPES
// ============================================================

/**
 * Response from fields endpoint
 */
export interface FieldsResponse {
  /** Field metadata */
  Data: Record<string, any>[];
}

// ============================================================
// FETCH FIELD TYPES
// ============================================================

/**
 * Single option returned from fetch field endpoint
 */
export interface FetchFieldOption {
  /** The value to be stored */
  Value: string;
  /** The display label */
  Label: string;
}

/**
 * Response from fetch field endpoint
 */
export interface FetchFieldResponse {
  /** Array of field options */
  Data: FetchFieldOption[];
}