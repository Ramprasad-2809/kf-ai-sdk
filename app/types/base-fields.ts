/**
 * Base field type for ID fields
 * Resolves to: string
 * Use this for all ID-type fields (user IDs, order IDs, etc.)
 */
export type IdField = string;

/**
 * String field with optional literal type constraint and length limits
 * @template T - Literal string type (e.g., 'pending' | 'completed')
 * @template MinLength - Minimum string length (optional)
 * @template MaxLength - Maximum string length (optional)
 * Resolves to: T or string
 * Storage: VARCHAR in database
 *
 * @example
 * StringField // => string
 * StringField<'active' | 'inactive'> // => 'active' | 'inactive'
 * StringField<string, 1, 100> // => string with length constraints
 */
export type StringField<
  T extends string = string,
  MinLength extends number = never,
  MaxLength extends number = never
> = T;

/**
 * Multi-line text field for longer content
 * Resolves to: string
 * Storage: TEXT in database
 * Use this for descriptions, comments, rich text content
 *
 * @example
 * TextAreaField // => string (multi-line)
 */
export type TextAreaField = string;

/**
 * Numeric field with optional precision constraints
 * @template Precision - Number of decimal places (optional)
 * Resolves to: number
 * Storage: DECIMAL/FLOAT in database
 * Use this for quantities, measurements, calculations
 *
 * @example
 * NumberField // => number
 * NumberField<2> // => number with 2 decimal places
 */
export type NumberField<Precision extends number = never> = number;

/**
 * Large integer field for big numbers
 * Resolves to: number
 * Storage: BIGINT in database  
 * Use this for large counters, timestamps, file sizes
 *
 * @example
 * LongField // => number (large integer)
 */
export type LongField = number;

/**
 * Boolean field
 * Resolves to: boolean
 * Storage: BOOLEAN in database
 * Use this for true/false values, flags, toggles
 */
export type BooleanField = boolean;

/**
 * Date field (date only, no time)
 * Resolves to: Date
 * Storage: DATE in database
 * Use this for birth dates, due dates, calendar events
 *
 * @example
 * DateField // => Date (date only)
 */
export type DateField = Date;

/**
 * DateTime field (date and time)
 * Resolves to: Date
 * Storage: DATETIME/TIMESTAMP in database
 * Use this for created_at, updated_at, event timestamps
 *
 * @example
 * DateTimeField // => Date (with time)
 */
export type DateTimeField = Date;

// ============================================================
// COMPLEX FIELD TYPES
// ============================================================

/**
 * Currency field supporting multiple value formats
 * Resolves to: CurrencyValue
 * Storage: JSON/VARCHAR in database
 * Use this for prices, monetary amounts, financial data
 *
 * @example
 * CurrencyField // => {value: number, currency: string} | string
 */
export type CurrencyField = CurrencyValue;

/**
 * Currency value format - supports both object and string representations
 */
export type CurrencyValue = 
  | { value: number; currency: string }  // Object format: {value: 100.50, currency: "USD"}
  | string;                              // String format: "100.50 USD" or "USD 100.50"

/**
 * JSON field for structured data
 * @template T - Expected JSON structure (optional)
 * Resolves to: T or JSONValue
 * Storage: JSON/TEXT in database
 * Use this for configurations, metadata, flexible schemas
 *
 * @example
 * JSONField // => JSONValue (any valid JSON)
 * JSONField<{settings: {theme: string}}> // => {settings: {theme: string}}
 */
export type JSONField<T = JSONValue> = T;

/**
 * Valid JSON value types
 */
export type JSONValue = 
  | string
  | number
  | boolean
  | null
  | JSONObject
  | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

/**
 * Select field for single choice from predefined options
 * @template T - Union of allowed option values
 * Resolves to: T
 * Storage: VARCHAR in database
 * Use this for status fields, categories, enum-like values
 *
 * @example
 * SelectField<'active' | 'inactive' | 'pending'> // => 'active' | 'inactive' | 'pending'
 */
export type SelectField<T extends string> = T;

/**
 * Lookup field for references to other records
 * @template T - Type of the referenced record ID (defaults to string)
 * Resolves to: T
 * Storage: VARCHAR in database (stores the ID)
 * Use this for foreign keys, relationships, references
 *
 * @example
 * LookupField // => string (referenced record ID)
 * LookupField<IdField> // => string (typed as IdField)
 */
export type LookupField<T extends string = string> = T;

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
 * ArrayField<string> // => string[]
 * ArrayField<IdField> // => string[]
 * ArrayField<SelectField<'tag1' | 'tag2'>> // => ('tag1' | 'tag2')[]
 */
export type ArrayField<T> = T[];

/**
 * Nested object field
 * @template T - Shape of nested object
 * Resolves to: T
 * Storage: JSON in database
 * Use this for complex nested structures, embedded documents
 *
 * @example
 * ObjectField<{ name: string; age: number }> // => { name: string; age: number }
 */
export type ObjectField<T extends Record<string, any>> = T;

/**
 * Optional field wrapper
 * @template T - Base field type
 * Resolves to: T | undefined
 * Use this for fields that may not have values
 *
 * @example
 * OptionalField<StringField> // => string | undefined
 * OptionalField<NumberField> // => number | undefined
 */
export type OptionalField<T> = T | undefined;

// ============================================================
// UTILITY TYPES FOR FIELD VALIDATION
// ============================================================

/**
 * Utility type to extract the base type from a field type
 * Useful for runtime validation and type guards
 */
export type ExtractFieldType<T> = T extends OptionalField<infer U> ? U : T;

/**
 * Type guard to check if a value is a valid currency object
 */
export function isCurrencyObject(value: any): value is { value: number; currency: string } {
  return typeof value === 'object' && 
         value !== null && 
         typeof value.value === 'number' && 
         typeof value.currency === 'string';
}

/**
 * Type guard to check if a value is valid JSON
 */
export function isValidJSON(value: any): value is JSONValue {
  try {
    JSON.parse(JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}