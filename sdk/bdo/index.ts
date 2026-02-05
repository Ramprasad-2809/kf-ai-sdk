// ============================================================
// BDO MODULE INDEX
// Internal module exports
// ============================================================

// Core classes
export { BaseBdo, type SystemFields } from "./core/BaseBdo";
export {
  Item,
  type ItemWithData,
  type FieldAccessorLike,
  type EditableFieldAccessor,
  type ReadonlyFieldAccessor,
} from "./core/Item";

// Types
export type {
  ValidationResult,
  SelectOption,
  FieldConfig,
  SelectFieldConfig,
  ReferenceFieldConfig,
  FieldMeta,
  SelectFieldMeta,
  ReferenceFieldMeta,
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

// Expression engine
export { ExpressionEngine } from "./expressions";
export type {
  ExpressionTreeType,
  ExpressionContext,
  ValidationRule,
  FieldDefinition,
  BDOMetadata,
} from "./expressions";
