/**
 * Sort direction for API queries (matching API spec)
 */
export type SortDirection = "ASC" | "DESC";

/**
 * Sort configuration for a single field (API spec format)
 */
export interface SortOption {
  /** Field to sort by */
  Field: string;
  /** Sort direction */
  Order: SortDirection;
}

/**
 * Sort configuration: array of sort options
 */
export type Sort = SortOption[];

/**
 * Filter operators for individual conditions (leaf nodes)
 */
export type FilterOperator =
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE"
  | "Between" | "NotBetween" | "IN" | "NIN"
  | "Empty" | "NotEmpty" | "Contains" | "NotContains"
  | "MinLength" | "MaxLength";

/**
 * Logical operators for combining filter conditions (tree nodes)
 */
export type LogicalOperator = "And" | "Or" | "Not";

/**
 * RHS value type for filter conditions
 */
export type FilterRHSType = "Constant" | "BOField" | "AppVariable";

/**
 * Base interface for all filter nodes
 */
interface FilterNodeBase {
  /** Operator type */
  Operator: FilterOperator | LogicalOperator;
}

/**
 * Leaf filter condition (actual field comparison)
 */
export interface FilterCondition extends FilterNodeBase {
  /** Condition operator */
  Operator: FilterOperator;
  /** Left-hand side field name */
  LHSField: string;
  /** Right-hand side value */
  RHSValue: any;
  /** Right-hand side type (optional, defaults to Constant) */
  RHSType?: FilterRHSType;
}

/**
 * Logical filter node (combines multiple conditions)
 */
export interface FilterLogical extends FilterNodeBase {
  /** Logical operator */
  Operator: LogicalOperator;
  /** Nested conditions (can be FilterCondition or FilterLogical) */
  Condition: Array<FilterCondition | FilterLogical>;
}

/**
 * Filter structure matching API specification (root level)
 * This is a discriminated union - a filter is either a logical node or a condition
 */
export type Filter = FilterLogical;

/**
 * Convenience type for any filter node (leaf or logical)
 */
export type FilterNode = FilterCondition | FilterLogical;

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
  Type?: "List" | "Aggregation" | "Pivot";

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