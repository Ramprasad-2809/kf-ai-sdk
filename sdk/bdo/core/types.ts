// ============================================================
// BDO-SPECIFIC TYPES
// ============================================================

/**
 * BDO-level metadata — identifies the business object
 */
export interface BdoMetaType {
  readonly _id: string;
  readonly name: string;
}

/**
 * Result of field validation
 */
export interface ValidationResultType {
  valid: boolean;
  errors: string[];
}

/**
 * Base field metadata — only id, label, and isEditable.
 * Specialized fields (SelectField, ReferenceField) extend this with their own properties.
 */
export interface FieldMetaType {
  readonly id: string;
  readonly label: string;
  readonly isEditable: boolean;
}

/**
 * SelectField meta — extends FieldMetaType with static options
 */
export interface SelectFieldMetaType<T = string> extends FieldMetaType {
  readonly options: readonly SelectOptionType<T>[];
}

/**
 * ReferenceField meta — extends FieldMetaType with reference info
 */
export interface ReferenceFieldMetaType extends FieldMetaType {
  readonly reference: { bdo: string; fields: string[] };
}


/**
 * Option for select fields
 */
export interface SelectOptionType<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * Base configuration for all fields
 */
export interface FieldConfigType {
  id: string;
  label: string;
  editable?: boolean;
}

/**
 * Configuration for select fields with predefined options
 */
export interface SelectFieldConfigType<T extends string> extends FieldConfigType {
  options: readonly SelectOptionType<T>[];
}

/**
 * Configuration for reference fields that link to other BDOs
 */
export interface ReferenceFieldConfigType<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TRef = unknown,
> extends FieldConfigType {
  referenceBdo: string;
  referenceFields?: readonly string[];
}

