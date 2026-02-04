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
 * Base field metadata containing id, label, and optional field-specific info
 */
export interface FieldMeta {
  readonly id: string;
  readonly label: string;
  readonly options?: readonly { value: unknown; label: string; disabled?: boolean }[];
  readonly reference?: { bdo: string; fields: string[] };
  readonly fetchOptions?: (instanceId?: string) => Promise<unknown[]>;
}

/**
 * SelectField meta with static options and fetchOptions for dynamic refresh
 */
export interface SelectFieldMeta<T = string> extends Omit<FieldMeta, 'options' | 'fetchOptions'> {
  readonly options: readonly SelectOption<T>[];
  readonly fetchOptions: (instanceId?: string) => Promise<SelectOption<T>[]>;
}

/**
 * ReferenceField meta with reference info and fetchOptions for dynamic lookup
 */
export interface ReferenceFieldMeta<TRef = unknown> extends Omit<FieldMeta, 'reference' | 'fetchOptions'> {
  readonly reference: { bdo: string; fields: string[] };
  readonly fetchOptions: (instanceId?: string) => Promise<TRef[]>;
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

// ============================================================
// FIELD ACCESSOR INTERFACES
// ============================================================

/**
 * Base interface for accessing and manipulating field values
 */
export interface FieldAccessorInterface<T> {
  get(): T | undefined;
  set(value: T): void;
  validate(): ValidationResult;
}

/**
 * Extended accessor for select fields with access to options
 */
export interface SelectFieldAccessorInterface<T>
  extends FieldAccessorInterface<T> {
  options(): readonly SelectOption<T>[];
}

/**
 * Extended accessor for reference fields with reference metadata
 */
export interface ReferenceFieldAccessorInterface<T>
  extends FieldAccessorInterface<T> {
  readonly reference: {
    bdo: string;
    fields: string[];
  };
}
