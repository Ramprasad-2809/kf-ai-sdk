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
 * Filter operators supported by the API
 */
export type FilterOperator = 
  | "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" 
  | "Between" | "NotBetween" | "IN" | "NIN"
  | "Empty" | "NotEmpty" | "Contains" | "NotContains"
  | "MinLength" | "MaxLength" | "AND" | "OR";

/**
 * RHS value type for filter conditions
 */
export type FilterRHSType = "Constant" | "BOField" | "AppVariable";

/**
 * Individual filter condition
 */
export interface FilterCondition {
  /** Filter operator */
  Operator: FilterOperator;
  /** Left-hand side field name */
  LHSField: string;
  /** Right-hand side value */
  RHSValue: any;
  /** Right-hand side type (optional, defaults to Constant) */
  RHSType?: FilterRHSType;
  /** Nested conditions for AND/OR operators */
  Condition?: FilterCondition[];
}

/**
 * Filter structure matching API specification
 */
export interface Filter {
  /** Logical operator for combining conditions */
  Operator: "AND" | "OR";
  /** Array of filter conditions */
  Condition: FilterCondition[];
}

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

  /** Page number (1-indexed) */
  Page?: number;

  /** Records per page */
  PageSize?: number;
}