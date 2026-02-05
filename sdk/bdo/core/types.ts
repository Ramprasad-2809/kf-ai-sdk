// ============================================================
// BDO-SPECIFIC TYPES
// ============================================================

/**
 * Result of field validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Base field metadata — only id, label, and isEditable.
 * Specialized fields (SelectField, ReferenceField) extend this with their own properties.
 */
export interface FieldMeta {
  readonly id: string;
  readonly label: string;
  readonly isEditable: boolean;
}

/**
 * SelectField meta — extends FieldMeta with static options
 */
export interface SelectFieldMeta<T = string> extends FieldMeta {
  readonly options: readonly SelectOption<T>[];
}

/**
 * ReferenceField meta — extends FieldMeta with reference info
 */
export interface ReferenceFieldMeta extends FieldMeta {
  readonly reference: { bdo: string; fields: string[] };
}


/**
 * Option for select fields
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * Base configuration for all fields
 */
export interface FieldConfig {
  id: string;
  label: string;
  editable?: boolean;
}

/**
 * Configuration for select fields with predefined options
 */
export interface SelectFieldConfig<T extends string> extends FieldConfig {
  options: readonly SelectOption<T>[];
}

/**
 * Configuration for reference fields that link to other BDOs
 */
export interface ReferenceFieldConfig<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TRef = unknown,
> extends FieldConfig {
  referenceBdo: string;
  referenceFields?: readonly string[];
}

