// ============================================================
// BDO ENTRY POINT
// Main exports for @ram_28/kf-ai-sdk/bdo
// ============================================================

// Core classes
export { BaseBdo } from "./bdo/core/BaseBdo";
export type { SystemFields } from "./bdo/core/BaseBdo";

// Field classes
export {
  StringField,
  NumberField,
  BooleanField,
  DateTimeField,
  SelectField,
  ReferenceField,
  ArrayField,
} from "./bdo/fields";

// Re-export types for consumer convenience
export type {
  StringFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  ReferenceFieldType,
  ArrayFieldType,
  SystemFieldsType,
  UserRefType,
} from "./types/base-fields";

// BDO-specific types
export type {
  BdoMetaType,
  ValidationResultType,
  SelectOptionType,
  FieldConfigType,
  SelectFieldConfigType,
  ReferenceFieldConfigType,
  FieldMetaType,
} from "./bdo/core/types";

// ItemType
export type { ItemType } from "./bdo/core/Item";

// Constants
export { SystemField } from "./types/constants";
