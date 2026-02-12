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
  BaseFieldAccessorType,
} from "./core/types";

// Field classes
export {
  BaseField,
  StringField,
  NumberField,
  BooleanField,
  DateTimeField,
  DateField,
  TextField,
  TextAreaField,
  SelectField,
  ReferenceField,
  ArrayField,
  ObjectField,
  UserField,
  FileField,
} from "./fields";
