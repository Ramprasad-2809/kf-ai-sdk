/**
 * Sort direction for API queries (matching API spec)
 */
export type SortDirectionType = "ASC" | "DESC";

/**
 * Sort configuration: array of field-direction mappings
 * Format: [{ "fieldName": "ASC" }, { "anotherField": "DESC" }]
 */
export type SortOptionType = Record<string, SortDirectionType>;

/**
 * Sort configuration: array of sort options
 */
export type SortType = SortOptionType[];

/**
 * Condition operators for individual conditions (leaf nodes)
 * Used in Condition.Operator
 */
export type ConditionOperatorType =
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE"
  | "Between" | "NotBetween" | "IN" | "NIN"
  | "Empty" | "NotEmpty" | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

/**
 * Operators for combining conditions in a group (tree nodes)
 * Used in ConditionGroup.Operator
 */
export type ConditionGroupOperatorType = "And" | "Or" | "Not";

/**
 * RHS value type for filter conditions
 */
export type FilterRHSTypeType = "Constant" | "BOField" | "AppVariable";

/**
 * Leaf condition (actual field comparison)
 * @template T - Data type for type-safe field names (defaults to any)
 */
export interface ConditionType<T = any> {
  /** Optional ID for hook state management (omitted in API payload) */
  id?: string;
  /** Condition operator */
  Operator: ConditionOperatorType;
  /** Left-hand side field name (keyof T when generic is provided) */
  LHSField: T extends any ? keyof T | string : string;
  /** Right-hand side value */
  RHSValue: any;
  /** Right-hand side type (optional, defaults to Constant) */
  RHSType?: FilterRHSTypeType;
}

/**
 * Group combining conditions (recursive structure)
 * @template T - Data type for type-safe field names (defaults to any)
 */
export interface ConditionGroupType<T = any> {
  /** Optional ID for hook state management (omitted in API payload) */
  id?: string;
  /** Group operator (And, Or, Not) */
  Operator: ConditionGroupOperatorType;
  /** Nested conditions (can be Condition or ConditionGroup) */
  Condition: Array<ConditionType<T> | ConditionGroupType<T>>;
}

/**
 * Root filter type (alias for ConditionGroup)
 * @template T - Data type for type-safe field names (defaults to any)
 */
export type FilterType<T = any> = ConditionGroupType<T>;

/**
 * DateTime encoding format used by the API
 */
export interface DateTimeEncodedType {
  $__dt__: number;
}

/**
 * Date encoding format used by the API
 */
export interface DateEncodedType {
  $__d__: string;
}

/**
 * Standard paginated list response
 * @template T - Type of items in the list
 */
export interface ListResponseType<T> {
  /** Array of items for current page */
  Data: T[];
}

/**
 * Read API response wrapper
 * @template T - Type of the data object
 */
export interface ReadResponseType<T> {
  /** The data object */
  Data: T;
}

/**
 * Create/Update API response
 */
export interface CreateUpdateResponseType {
  /** ID of the created/updated record */
  _id: string;
}

/**
 * Delete API response
 */
export interface DeleteResponseType {
  /** Status of the delete operation */
  status: "success";
}

/**
 * Count API response
 */
export interface CountResponseType {
  /** Total count of matching records */
  Count: number;
}

/**
 * Options for list queries (API request format)
 */
export interface ListOptionsType {
  /** Query type (defaults to "List") */
  Type?: "List";

  /** Specific fields to return */
  Field?: string[];

  /** Filter criteria */
  Filter?: FilterType;

  /** Sort configuration */
  Sort?: SortType;

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
export type MetricTypeType =
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
export interface MetricFieldType {
  /** Field to aggregate */
  Field: string;
  /** Aggregation function type */
  Type: MetricTypeType;
}

/**
 * Options for metric/aggregate queries
 */
export interface MetricOptionsType {
  /** Query type (always "Metric") */
  Type: "Metric";
  /** Fields to group by */
  GroupBy: string[];
  /** Metric definitions */
  Metric: MetricFieldType[];
  /** Optional filter criteria */
  Filter?: FilterType;
}

/**
 * Response from metric endpoint
 */
export interface MetricResponseType {
  /** Aggregated data rows */
  Data: Record<string, any>[];
}

// ============================================================
// PIVOT TYPES
// ============================================================

/**
 * Pivot table header item (hierarchical)
 */
export interface PivotHeaderItemType {
  /** Header key/label */
  Key: string;
  /** Child headers for nested grouping */
  Children?: PivotHeaderItemType[] | null;
}

/**
 * Pivot response data structure
 */
export interface PivotResponseDataType {
  /** Row headers */
  RowHeader: PivotHeaderItemType[];
  /** Column headers */
  ColumnHeader: PivotHeaderItemType[];
  /** Value matrix [row][column] */
  Value: (number | string | null)[][];
}

/**
 * Options for pivot queries
 */
export interface PivotOptionsType {
  /** Query type (always "Pivot") */
  Type: "Pivot";
  /** Row dimension fields */
  Row: string[];
  /** Column dimension fields */
  Column: string[];
  /** Metric definitions */
  Metric: MetricFieldType[];
  /** Optional filter criteria */
  Filter?: FilterType;
}

/**
 * Response from pivot endpoint
 */
export interface PivotResponseType {
  /** Pivot data including headers and values */
  Data: PivotResponseDataType;
}

// ============================================================
// DRAFT/INTERACTIVE TYPES
// ============================================================

/**
 * Response from draft operations
 */
export interface DraftResponseType {
  /** Computed field values */
  [fieldName: string]: any;
}

// ============================================================
// FIELDS METADATA TYPES
// ============================================================

/**
 * Response from fields endpoint
 */
export interface FieldsResponseType {
  /** Field metadata */
  Data: Record<string, any>[];
}

// ============================================================
// FETCH FIELD TYPES
// ============================================================

/**
 * Single option returned from fetch field endpoint
 */
export interface FetchFieldOptionType {
  /** The value to be stored */
  Value: string;
  /** The display label */
  Label: string;
}

/**
 * Response from fetch field endpoint
 */
export interface FetchFieldResponseType {
  /** Array of field options */
  Data: FetchFieldOptionType[];
}

// ============================================================
// SHARED COMPONENT TYPES
// ============================================================

/**
 * Column definition for data display and behavior
 * Used by useTable and useKanban for defining field configurations
 * @template T - Data type for type-safe field names
 */
export interface ColumnDefinitionType<T> {
  /** Field name from the data type */
  fieldId: keyof T;
  /** Display label (optional, defaults to fieldId) */
  label?: string;
  /** Enable sorting for this field */
  enableSorting?: boolean;
  /** Enable filtering for this field */
  enableFiltering?: boolean;
  /** Custom transform function (overrides auto-formatting) */
  transform?: (value: any, item: T) => React.ReactNode;
}
