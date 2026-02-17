// ============================================================
// BDO TYPE-ONLY ENTRY POINT
// Type-only exports for @ram_28/kf-ai-sdk/bdo/types
// Zero runtime code - purely for type imports
// ============================================================

// BDO-specific types
export type {
  ValidationResultType,
  SelectOptionType,
  BdoMetaType,
  BaseFieldMetaType,
  BaseConstraintType,
  StringFieldMetaType,
  TextFieldMetaType,
  NumberFieldMetaType,
  BooleanFieldMetaType,
  DateFieldMetaType,
  DateTimeFieldMetaType,
  SelectFieldMetaType,
  ReferenceFieldMetaType,
  UserFieldMetaType,
  ArrayFieldMetaType,
  ObjectFieldMetaType,
  FileFieldMetaType,
  ImageFieldMetaType,
  BaseFieldAccessorType,
  EditableFieldAccessorType,
  ReadonlyFieldAccessorType,
  FieldAccessorType,
  EditableImageFieldAccessorType,
  ReadonlyImageFieldAccessorType,
  EditableFileFieldAccessorType,
  ReadonlyFileFieldAccessorType,
} from "./bdo/core/types";

// Re-export SDK field types
export type {
  StringFieldType,
  NumberFieldType,
  BooleanFieldType,
  DateFieldType,
  DateTimeFieldType,
  TextFieldType,
  TextAreaFieldType,
  SelectFieldType,
  ReferenceFieldType,
  ArrayFieldType,
  ObjectFieldType,
  UserFieldType,
  FileType,
  ImageFieldType,
  FileFieldType,
  SystemFieldsType,
  UserRefType,
} from "./types/base-fields";

// SystemFields type
export type { SystemFields } from "./bdo/core/BaseBdo";

// ItemType
export type { ItemType } from "./bdo/core/Item";
