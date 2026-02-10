// ============================================================
// BASE TYPES MODULE - Field Type Exports
// @ram_28/kf-ai-sdk/types
// ============================================================

export type {
  // String fields
  StringFieldType,
  TextAreaFieldType,

  // Numeric fields
  NumberFieldType,
  LongFieldType,

  // Boolean field
  BooleanFieldType,

  // Date/Time fields
  DateFieldType,
  DateTimeFieldType,

  // Complex fields
  CurrencyFieldType,
  CurrencyValueType,
  JSONFieldType,
  ReferenceFieldType,
  ExtractReferenceType,
  ExtractFetchFieldType,

  // JSON types
  JSONValueType,
  JSONObjectType,
  JSONArrayType,

  // Select fields
  SelectFieldType,

  // Container types
  ArrayFieldType,
  ObjectFieldType,
  OptionalFieldType,

  // Utility types
  ExtractFieldType,
} from './types/base-fields';
