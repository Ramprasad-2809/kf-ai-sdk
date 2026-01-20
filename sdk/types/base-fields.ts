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
 * Date field (date only, no time)
 * Resolves to: Date
 * Storage: DATE in database
 * Use this for birth dates, due dates, calendar events
 *
 * @example
 * DateFieldType // => Date (date only)
 */
export type DateFieldType = Date;

/**
 * DateTime field (date and time)
 * Resolves to: Date
 * Storage: DATETIME/TIMESTAMP in database
 * Use this for created_at, updated_at, event timestamps
 *
 * @example
 * DateTimeFieldType // => Date (with time)
 */
export type DateTimeFieldType = Date;

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

export type ReferenceFieldType = string;

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
 * Lookup field for references to other records
 * @template T - Type of the referenced record ID (defaults to string)
 * Resolves to: T
 * Storage: VARCHAR in database (stores the ID)
 * Use this for foreign keys, relationships, references
 *
 * @example
 * LookupFieldType // => string (referenced record ID)
 * LookupFieldType<IdFieldType> // => string (typed as IdFieldType)
 */
export type LookupFieldType<T extends string = string> = T;

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
