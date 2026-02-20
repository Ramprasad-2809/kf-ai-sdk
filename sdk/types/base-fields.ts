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
 * Text field for longer content (replaces TextAreaFieldType)
 * Resolves to: string
 * Storage: TEXT in database
 * Use this for descriptions, comments, rich text content
 */
export type TextFieldType = string;

/**
 * Multi-line text field (deprecated alias for TextFieldType)
 * @deprecated Use TextFieldType instead
 */
export type TextAreaFieldType = TextFieldType;

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

type Year = `${number}${number}${number}${number}`;
type Month = `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `1${0 | 1 | 2}`;
type Day =
  | `${0}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `${1 | 2}${number}`
  | `3${0 | 1}`;

/**
 * Date field (date only, no time)
 * API Request Format: "YYYY-MM-DD"
 * Storage: DATE in database
 *
 * @example
 * // Response from API:
 * "2025-05-01"
 */

export type DateFieldType = `${Year}-${Month}-${Day}`;

type Hour = number;
type Minute = number;
type Second = number;

/**
 * DateTime field (date and time)
 * API Request Format: "YYYY-MM-DDTHH:MM:SSZ"
 * API Response Format: "YYYY-MM-DDTHH:MM:SSZ" (always UTC)
 * Use this for created_at, updated_at, event timestamps
 *
 * @example
 * "2026-01-23T01:21:33Z"
 */

export type DateTimeFieldType =
  `${Year}-${Month}-${Day}T${Hour}:${Minute}:${Second}Z`;

// ============================================================
// COMPLEX FIELD TYPES
// ============================================================

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
export type ExtractFetchFieldType<T> = T extends { _id: string }
  ? T
  : { Value: string; Label: string };

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
export type SelectFieldType<T extends string | number = string> = T;

// ============================================================
// NEW FIELD VALUE TYPES
// ============================================================

/**
 * User field for user references
 * Resolves to: { _id: string; _name: string }
 */
export type UserFieldType = { _id: string; _name: string };

/**
 * Metadata for an individual uploaded file/image attachment
 */
export interface FileType {
  _id: string;
  _name: string;
  FileName: string;
  FileExtension: string;
  Size: number;
  ContentType: string;
}

/**
 * Image field for single image attachments (nullable)
 * Resolves to: FileType | null
 */
export type ImageFieldType = FileType | null;

/**
 * File field for file attachments (array of files)
 * Resolves to: FileType[]
 */
export type FileFieldType = FileType[];

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
 * ArrayFieldType<StringFieldType> // => string[]
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
export type ExtractFieldType<T> =
  T extends OptionalFieldType<infer U> ? U : T;

// ============================================================
// SYSTEM FIELD TYPES
// ============================================================

/**
 * User reference type for _created_by / _modified_by fields
 * @deprecated Use UserFieldType instead
 */
export type UserRefType = UserFieldType;

/**
 * System fields type - use with intersection (&) in entity types
 * Contains all 7 system-managed fields that every BDO has.
 *
 * @example
 * export type ProductType = {
 *   ProductId: StringFieldType;
 *   Title: StringFieldType;
 *   // ... business fields only
 * } & SystemFieldsType;
 */
export type SystemFieldsType = {
  _id: StringFieldType;
  _created_at: DateTimeFieldType;
  _modified_at: DateTimeFieldType;
  _created_by: UserFieldType;
  _modified_by: UserFieldType;
  _version: StringFieldType;
  _m_version: StringFieldType;
};

/**
 * Union of system field names - for Omit<> operations
 */
export type SystemFields = keyof SystemFieldsType;
