// ============================================================
// BDO ENTRY POINT
// Main exports for @ram_28/kf-ai-sdk/bdo
// ============================================================

// Core classes
export { BaseBdo, type SystemFields } from "./bdo/core/BaseBdo";
export {
  Item,
  type FieldAccessorLike,
  type EditableFieldAccessor,
  type ReadonlyFieldAccessor,
} from "./bdo/core/Item";

// Field classes
export {
  BaseField,
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

export type {
  ListOptionsType,
  CreateUpdateResponseType,
  DeleteResponseType,
  CountResponseType,
  MetricOptionsType,
  MetricResponseType,
  PivotOptionsType,
  PivotResponseType,
  DraftResponseType,
  FilterType,
  ConditionType,
  ConditionGroupType,
  SortType,
} from "./types/common";

// BDO-specific types
export type {
  ValidationResult,
  SelectOption,
  FieldConfig,
  SelectFieldConfig,
  ReferenceFieldConfig,
  FieldMeta,
} from "./bdo/core/types";

// ItemWithData type
export type { ItemWithData } from "./bdo/core/Item";

// Constants
export {
  SystemField,
  ConditionOperator,
  GroupOperator,
  RHSType,
  SortDirection,
} from "./types/constants";
