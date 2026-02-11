// ============================================================
// BDO MODULE INDEX
// Internal module exports
// ============================================================

// Core classes
export { BaseBdo, type SystemFields } from "./core/BaseBdo";
export {
  Item,
  type ItemType,
  type FieldAccessorType,
  type EditableFieldAccessorType,
  type ReadonlyFieldAccessorType,
} from "./core/Item";

// Types
export type {
  BdoMetaType,
  ValidationResultType,
  SelectOptionType,
  FieldConfigType,
  SelectFieldConfigType,
  ReferenceFieldConfigType,
  FieldMetaType,
  SelectFieldMetaType,
  ReferenceFieldMetaType,
} from "./core/types";

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
} from "./fields";
