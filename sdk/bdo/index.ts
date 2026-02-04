// ============================================================
// BDO MODULE INDEX
// Internal module exports
// ============================================================

// Core classes
export { BaseBdo, type SystemFields } from "./core/BaseBdo";
export { Item, type ItemWithData, type FieldAccessorLike } from "./core/Item";

// Types
export type {
  ValidationResult,
  SelectOption,
  FieldConfig,
  SelectFieldConfig,
  ReferenceFieldConfig,
  FieldAccessorInterface,
  SelectFieldAccessorInterface,
  ReferenceFieldAccessorInterface,
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

// Accessor classes
export {
  FieldAccessor,
  SelectFieldAccessor,
  ReferenceFieldAccessor,
} from "./accessors";

// Expression engine
export { ExpressionEngine } from "./expressions";
export type {
  ExpressionTreeType,
  ExpressionContext,
  ValidationRule,
  FieldDefinition,
  BDOMetadata,
} from "./expressions";
