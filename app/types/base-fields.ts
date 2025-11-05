/**
 * Base field type for ID fields
 * Resolves to: string
 * Use this for all ID-type fields (user IDs, order IDs, etc.)
 */
export type IdField = string;

/**
 * String field with optional literal type constraint
 * @template T - Literal string type (e.g., 'pending' | 'completed')
 * Resolves to: T or string
 *
 * @example
 * StringField // => string
 * StringField<'active' | 'inactive'> // => 'active' | 'inactive'
 */
export type StringField<T extends string = string> = T;

/**
 * Numeric field
 * Resolves to: number
 * Use this for all numeric values (prices, quantities, etc.)
 */
export type NumberField = number;

/**
 * Boolean field
 * Resolves to: boolean
 * Use this for true/false values
 */
export type BooleanField = boolean;

/**
 * Date/DateTime field
 * Resolves to: Date
 * Use this for timestamps and date values
 */
export type DateField = Date;

/**
 * Array field
 * @template T - Type of array elements
 * Resolves to: T[]
 *
 * @example
 * ArrayField<string> // => string[]
 * ArrayField<IdField> // => string[]
 */
export type ArrayField<T> = T[];

/**
 * Nested object field
 * @template T - Shape of nested object
 * Resolves to: T
 *
 * @example
 * ObjectField<{ name: string; age: number }> // => { name: string; age: number }
 */
export type ObjectField<T extends Record<string, any>> = T;

/**
 * Optional field wrapper
 * @template T - Base field type
 * Resolves to: T | undefined
 *
 * @example
 * OptionalField<StringField> // => string | undefined
 * OptionalField<NumberField> // => number | undefined
 */
export type OptionalField<T> = T | undefined;