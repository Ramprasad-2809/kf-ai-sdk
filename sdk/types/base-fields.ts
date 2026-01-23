/**
 * Base field type for ID fields
 * Resolves to: string
 * Use this for all ID-type fields (user IDs, order IDs, etc.)
 */
export type IdFieldType = string;

/**
 * String field with optional literal type constraint and length limits
 * @template T - Literal string type (e.g., 'pending' | 'completed')
 * @template MinLength - Minimum string length (optional)
 * @template MaxLength - Maximum string length (optional)
 * Resolves to: T or string
 * Storage: VARCHAR in database
 *
 * @example
 * StringFieldType // => string
 * StringFieldType<'active' | 'inactive'> // => 'active' | 'inactive'
 * StringFieldType<string, 1, 100> // => string with length constraints
 */
export type StringFieldType<
  T extends string = string,
  _MinLength extends number = never,
  _MaxLength extends number = never,
> = T;

/**
 * Multi-line text field for longer content
 * Resolves to: string
 * Storage: TEXT in database
 * Use this for descriptions, comments, rich text content
 *
 * @example
 * TextAreaFieldType // => string (multi-line)
 */
export type TextAreaFieldType = string;

/**
 * Numeric field with optional precision constraints
 * @template Precision - Number of decimal places (optional)
 * Resolves to: number
 * Storage: DECIMAL/FLOAT in database
 * Use this for quantities, measurements, calculations
 *
 * @example
 * NumberFieldType // => number
 * NumberFieldType<2> // => number with 2 decimal places
 */
export type NumberFieldType<_Precision extends number = never> = number;

/**
 * Large integer field for big numbers
 * Resolves to: number
 * Storage: BIGINT in database
 * Use this for large counters, timestamps, file sizes
 *
 * @example
 * LongFieldType // => number (large integer)
 */
export type LongFieldType = number;

/**
 * Boolean field
 * Resolves to: boolean
 * Storage: BOOLEAN in database
 * Use this for true/false values, flags, toggles
 */
export type BooleanFieldType = boolean;

/**
 * Encoded date format from API response
 * API returns: { "$__d__": "YYYY-MM-DD" }
 */
export interface DateEncodedType {
  $__d__: string;
}

/**
 * Encoded datetime format from API response
 * API returns: { "$__dt__": unix_timestamp_seconds }
 */
export interface DateTimeEncodedType {
  $__dt__: number;
}

/**
 * Date field (date only, no time)
 * API Response Format: { "$__d__": "YYYY-MM-DD" }
 * API Request Format: "YYYY-MM-DD"
 * Storage: DATE in database
 * Use this for birth dates, due dates, calendar events
 *
 * @example
 * // Response from API:
 * { "$__d__": "2025-03-15" }
 */
export type DateFieldType = DateEncodedType;

/**
 * DateTime field (date and time)
 * API Response Format: { "$__dt__": unix_timestamp_seconds }
 * API Request Format: "YYYY-MM-DD HH:MM:SS"
 * Storage: DATETIME/TIMESTAMP in database
 * Use this for created_at, updated_at, event timestamps
 *
 * @example
 * // Response from API:
 * { "$__dt__": 1769110463 }
 */
export type DateTimeFieldType = DateTimeEncodedType;

// ============================================================
// COMPLEX FIELD TYPES
// ============================================================

/**
 * Currency field supporting multiple value formats
 * Resolves to: CurrencyValueType
 * Storage: JSON/VARCHAR in database
 * Use this for prices, monetary amounts, financial data
 *
 * @example
 * CurrencyFieldType // => {value: number, currency: string} | string
 */
export type CurrencyFieldType = CurrencyValueType;

/**
 * Currency value format - supports both object and string representations
 */
export type CurrencyValueType =
  | { value: number; currency: string } // Object format: {value: 100.50, currency: "USD"}
  | string; // String format: "100.50 USD" or "USD 100.50"

/**
 * JSON field for structured data
 * @template T - Expected JSON structure (optional)
 * Resolves to: T or JSONValueType
 * Storage: JSON/TEXT in database
 * Use this for configurations, metadata, flexible schemas
 *
 * @example
 * JSONFieldType // => JSONValueType (any valid JSON)
 * JSONFieldType<{settings: {theme: string}}> // => {settings: {theme: string}}
 */
export type JSONFieldType<T = JSONValueType> = T;

/**
 * Reference/Lookup field for relationships to other Business Data Objects
 *
 * @template TReferencedType - The full type of the referenced BDO record
 *
 * Runtime behavior:
 * - The field stores the full referenced record (e.g., full supplier object)
 * - API returns the complete record from the referenced BDO
 * - On save, the full object is sent in the payload
 *
 * @example
 * SupplierInfo: ReferenceFieldType<BaseSupplierType>;
 * // At runtime: { _id: "...", SupplierId: "...", SupplierName: "...", ... }
 */
export type ReferenceFieldType<TReferencedType = unknown> = TReferencedType;

/**
 * Extract the referenced type from a ReferenceFieldType
 * Note: Since ReferenceFieldType<T> = T, this just returns T if it has _id
 */
export type ExtractReferenceType<T> = T extends { _id: string } ? T : never;

/**
 * Extract the type that fetchField should return for a given field type
 * - For Reference fields (objects with _id) → the full referenced record type
 * - For other field types → { Value: string; Label: string } (static dropdown)
 *
 * Detection: All BDO types have _id: string, so we check for that property
 * to distinguish reference fields from primitive fields like StringFieldType.
 *
 * @example
 * type SupplierOptions = ExtractFetchFieldType<BaseProductType["SupplierInfo"]>;
 * // Result: BaseSupplierType (has _id)
 *
 * type CategoryOptions = ExtractFetchFieldType<BaseProductType["Category"]>;
 * // Result: { Value: string; Label: string } (string has no _id)
 */
export type ExtractFetchFieldType<T> =
  T extends { _id: string }
    ? T
    : { Value: string; Label: string };

/**
 * Valid JSON value types
 */
export type JSONValueType =
  | string
  | number
  | boolean
  | null
  | JSONObjectType
  | JSONArrayType;

export interface JSONObjectType {
  [key: string]: JSONValueType;
}

export interface JSONArrayType extends Array<JSONValueType> {}

/**
 * Select field for single choice from predefined options
 * @template T - Union of allowed option values
 * Resolves to: T
 * Storage: VARCHAR in database
 * Use this for status fields, categories, enum-like values
 *
 * @example
 * SelectFieldType<'active' | 'inactive' | 'pending'> // => 'active' | 'inactive' | 'pending'
 */
export type SelectFieldType<T extends string> = T;

/**
 * Alias for ReferenceFieldType (Lookup = Reference in the backend)
 * @template TReferencedType - The full type of the referenced BDO record
 * @deprecated Use ReferenceFieldType instead
 */
export type LookupFieldType<TReferencedType = unknown> = ReferenceFieldType<TReferencedType>;

// ============================================================
// CONTAINER AND UTILITY TYPES
// ============================================================

/**
 * Array field with MultiValue support
 * @template T - Type of array elements
 * Resolves to: T[]
 * Storage: JSON in database
 * Use this for tags, categories, multiple selections
 *
 * @example
 * ArrayFieldType<string> // => string[]
 * ArrayFieldType<IdFieldType> // => string[]
 * ArrayFieldType<SelectFieldType<'tag1' | 'tag2'>> // => ('tag1' | 'tag2')[]
 */
export type ArrayFieldType<T> = T[];

/**
 * Nested object field
 * @template T - Shape of nested object
 * Resolves to: T
 * Storage: JSON in database
 * Use this for complex nested structures, embedded documents
 *
 * @example
 * ObjectFieldType<{ name: string; age: number }> // => { name: string; age: number }
 */
export type ObjectFieldType<T extends Record<string, any>> = T;

/**
 * Optional field wrapper
 * @template T - Base field type
 * Resolves to: T | undefined
 * Use this for fields that may not have values
 *
 * @example
 * OptionalFieldType<StringFieldType> // => string | undefined
 * OptionalFieldType<NumberFieldType> // => number | undefined
 */
export type OptionalFieldType<T> = T | undefined;

// ============================================================
// UTILITY TYPES FOR FIELD VALIDATION
// ============================================================

/**
 * Utility type to extract the base type from a field type
 * Useful for runtime validation and type guards
 */
export type ExtractFieldTypeType<T> = T extends OptionalFieldType<infer U> ? U : T;
