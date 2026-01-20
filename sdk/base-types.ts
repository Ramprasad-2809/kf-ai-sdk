// ============================================================
// BASE TYPES MODULE - Field Type Exports
// @ram_28/kf-ai-sdk/types
// ============================================================

export type {
  // ID and String fields
  IdFieldType,
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

  // JSON types
  JSONValueType,
  JSONObjectType,
  JSONArrayType,

  // Select/Lookup fields
  SelectFieldType,
  LookupFieldType,

  // Container types
  ArrayFieldType,
  ObjectFieldType,
  OptionalFieldType,

  // Utility types
  ExtractFieldTypeType,
} from './types/base-fields';
