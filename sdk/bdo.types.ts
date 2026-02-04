// ============================================================
// BDO TYPE-ONLY ENTRY POINT
// Type-only exports for @ram_28/kf-ai-sdk/bdo/types
// Zero runtime code - purely for type imports
// ============================================================

// BDO-specific types
export type {
  ValidationResult,
  SelectOption,
  FieldConfig,
  SelectFieldConfig,
  ReferenceFieldConfig,
  FieldAccessorInterface,
  SelectFieldAccessorInterface,
  ReferenceFieldAccessorInterface,
} from "./bdo/core/types";

// Re-export SDK field types
export type {
  StringFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  ReferenceFieldType,
  ArrayFieldType,
} from "./types/base-fields";

// Re-export API types
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

// SystemFields type
export type { SystemFields } from "./bdo/core/BaseBdo";

// ItemWithData type
export type { ItemWithData } from "./bdo/core/Item";
