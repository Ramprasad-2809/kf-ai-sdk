// ============================================================
// BASE FIELD CLASS
// Abstract base class for all field types
// ============================================================

import type { FieldConfig, ValidationResult, FieldMeta } from "../core/types";

/**
 * Abstract base class for all field definitions
 *
 * @template T - The TypeScript type of the field value
 *
 * @example
 * ```typescript
 * class CustomField extends BaseField<MyType> {
 *   validate(value: MyType | undefined): ValidationResult {
 *     // Custom validation logic
 *   }
 * }
 * ```
 */
export abstract class BaseField<T> {
  protected readonly id: string;
  protected readonly label: string;
  protected readonly editable: boolean;
  protected _parentBoId?: string;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.editable = config.editable ?? true;
  }

  /**
   * Validate a value for this field
   * Override in subclasses for custom validation
   */
  abstract validate(value: T | undefined): ValidationResult;

  /**
   * Get field metadata (id, label, and field-specific info)
   */
  get meta(): FieldMeta {
    return {
      id: this.id,
      label: this.label,
      isEditable: this.editable,
    };
  }
}
